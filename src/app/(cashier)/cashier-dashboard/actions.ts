"use server";

import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, branches, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { loyaltyService } from "@/lib/services/loyalty-service";
import { staffService } from "@/lib/services/staff-service";

// ─── SHARED HELPERS ──────────────────────────────────────────────────────────

async function resolveCashierContext() {
  const { userId } = await auth();
  if (!userId) throw new Error("Oturum bulunamadı.");

  const dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();
  if (!dbUser) throw new Error("Kullanıcı kaydı bulunamadı.");
  if (dbUser.role !== "CASHIER" && dbUser.role !== "MANAGER" && dbUser.role !== "BOSS" && dbUser.role !== "SUPER_ADMIN") {
    throw new Error("Bu işlem için kasiyer veya yönetici yetkisi gereklidir.");
  }

  // Aktif şube çerezinden branchId çöz
  const cookieStore = await cookies();
  const branchId = cookieStore.get("active_branch_id")?.value;
  if (!branchId) throw new Error("Aktif şube bağlamı bulunamadı. Lütfen şube seçin.");

  // orgId çöz
  const branch = await db.select({ orgId: branches.orgId })
    .from(branches)
    .where(eq(branches.id, branchId))
    .get();
  if (!branch) throw new Error("Şube bulunamadı.");

  return { dbUser, branchId, orgId: branch.orgId };
}

// ─── ACTIONS ─────────────────────────────────────────────────────────────────

/**
 * Telefon numarasıyla müşteri arama.
 * Cross-Tenant Isolation: yalnızca kasiyerin organizasyonundaki müşteriler aranır.
 */
export async function searchCustomerAction(phoneNumber: string) {
  try {
    if (!phoneNumber || phoneNumber.trim().length < 7) {
      return { error: "Geçerli bir telefon numarası giriniz." };
    }
    const { orgId } = await resolveCashierContext();
    const customer = await loyaltyService.findCustomerByPhone(orgId, phoneNumber.trim());
    if (!customer) return { found: false };
    return { found: true, customer };
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Arama hatası") };
  }
}

/**
 * Yeni müşteri kaydı.
 * organizationId kasiyerin aktif bağlamından peşin çözülür – istemciden alınmaz.
 */
export async function registerCustomerAction(name: string, phoneNumber: string) {
  try {
    if (!name?.trim() || !phoneNumber?.trim()) {
      return { error: "Ad soyad ve telefon numarası zorunludur." };
    }
    const { orgId } = await resolveCashierContext();
    const customer = await loyaltyService.registerCustomer(orgId, name.trim(), phoneNumber.trim());
    return { success: true, customer };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "";
    if (
      errMessage.includes("SQLITE_CONSTRAINT_UNIQUE") ||
      errMessage.includes("UNIQUE constraint failed") ||
      errMessage.includes("zaten mevcut")
    ) {
      try {
        const { orgId } = await resolveCashierContext();
        const existingCustomer = await loyaltyService.findCustomerByPhone(orgId, phoneNumber.trim());
        if (existingCustomer) {
          return {
            success: true,
            customer: existingCustomer,
            message: "Müşteri zaten kayıtlıymış, bilgileri otomatik getirildi."
          };
        }
      } catch (err: unknown) {
        console.error("[registerCustomerAction] implicit recovery lookup failed:", err);
      }
      return { success: false, error: "Bu telefon numarası ile kayıtlı bir müşteri zaten mevcut." };
    }
    return { error: (error instanceof Error ? error.message : "Kayıt hatası") };
  }
}

/**
 * Puan Kazanma Eylemi (EARN).
 * Guard Katmanları:
 *  1. Negatif/sıfır tutar reddi (kuruş bazında)
 *  2. staffService.requireBranchAccess – kasiyerin aktif şubede yetkisi
 *  3. LoyaltyService ACID transaction
 */
export async function earnPointsAction(customerId: string, amountSpentInKurus: number) {
  try {
    // 1. Girdi Sınır Muhafızı
    if (!amountSpentInKurus || amountSpentInKurus <= 0) {
      return { error: "Tutar 0'dan büyük olmalıdır." };
    }

    const { dbUser, branchId } = await resolveCashierContext();

    // 2. Şube Yetki Muhafızı
    await staffService.requireBranchAccess(dbUser.id, dbUser.role, branchId);

    // 3. İşlem yürütme
    const result = await loyaltyService.earnPoints(branchId, dbUser.id, customerId, amountSpentInKurus);
    return {
      success: true,
      message: `${result.pointsEarned} puan yüklendi!`,
      newTotal: result.newTotal,
    };
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "İşlem hatası") };
  }
}

/**
 * Puan Harcama Eylemi (BURN).
 * Guard Katmanları:
 *  1. Negatif/sıfır puan reddi
 *  2. staffService.requireBranchAccess – kasiyerin aktif şubede yetkisi
 *  3. LoyaltyService ACID transaction (DB-level race guard dahil)
 */
export async function burnPointsAction(customerId: string, pointsToBurn: number) {
  try {
    // 1. Girdi Sınır Muhafızı
    if (!pointsToBurn || pointsToBurn <= 0) {
      return { error: "Puan tutarı 0'dan büyük olmalıdır." };
    }

    const { dbUser, branchId } = await resolveCashierContext();

    // 2. Şube Yetki Muhafızı
    await staffService.requireBranchAccess(dbUser.id, dbUser.role, branchId);

    // 3. İşlem yürütme
    const result = await loyaltyService.burnPoints(branchId, dbUser.id, customerId, pointsToBurn);
    return {
      success: true,
      message: `${result.pointsBurned} puan harcandı!`,
      newTotal: result.newTotal,
    };
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "İşlem hatası") };
  }
}

/**
 * Şube aktif durumu denetimi (30 sn polling için).
 */
export async function getBranchStatus() {
  try {
    const cookieStore = await cookies();
    const branchId = cookieStore.get("active_branch_id")?.value;
    if (!branchId) return { isDeleted: true };

    const branch = await db.select({
      isActive: branches.isActive,
      orgId: branches.orgId,
    }).from(branches).where(eq(branches.id, branchId)).get();

    if (!branch) return { isDeleted: true };

    const org = await db.select({ isActive: organizations.isActive })
      .from(organizations)
      .where(eq(organizations.id, branch.orgId))
      .get();

    return {
      isActive: (branch.isActive && (org?.isActive ?? false)),
      isDeleted: false,
    };
  } catch {
    return { isDeleted: true };
  }
}

/**
 * Şubenin son mali işlemlerini (Audit Trail) listeler.
 * - staffService.requireBranchAccess yetkilendirmesi action kapısında gerçekleştirilir.
 * - Zaman damgası hydration hatalarını önlemek için Europe/Istanbul dilimine sunucu tarafında sabitlenir.
 */
export async function getRecentBranchTransactionsAction(limit: number = 10) {
  try {
    const { dbUser, branchId } = await resolveCashierContext();
    
    // 1. Yetki Kontrolü Action Kapısında Yapılır
    await staffService.requireBranchAccess(dbUser.id, dbUser.role, branchId);

    // 2. Servis Katmanı Çağrısı (Sadece doğrulanmış branchId paslanır)
    const rawTransactions = await loyaltyService.getRecentTransactions(branchId, limit);

    // 3. Sunucu Tarafı Zaman Dilimi Biçimlendirmesi (Europe/Istanbul) & İlişki Çözümlemesi
    const formatter = new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      dateStyle: "short",
      timeStyle: "short",
    });

    const transactions = rawTransactions.map((tx) => {
      return {
        id: tx.id,
        organizationId: tx.organizationId,
        branchId: tx.branchId,
        customerId: tx.customerId,
        cashierId: tx.cashierId,
        type: tx.type,
        amountSpent: tx.amountSpent,
        pointsAmount: tx.pointsAmount,
        createdAtFormatted: formatter.format(tx.createdAt), // "17.05.2026 15:45" (Europe/Istanbul)
        customerName: tx.customerName ?? "Anonim Müşteri",
        customerPhone: tx.customerPhone ?? "Bilinmeyen Telefon",
        cashierName: tx.cashierName ?? tx.cashierEmail ?? "Pasif Personel",
      };
    });

    return { success: true, transactions };
  } catch (error: unknown) {
    console.error("[getRecentBranchTransactionsAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "İşlemler listelenirken hata oluştu.",
    };
  }
}

// ─── ESKI UYUMLULUK ALIASLAR ─────────────────────────────────────────────────

/** @deprecated Kullanım: searchCustomerAction */
export async function findCustomerById(identifier: string) {
  const result = await searchCustomerAction(identifier);
  if ("error" in result || !result.found) return null;
  return result.customer ?? null;
}

/** @deprecated Kullanım: registerCustomerAction */
export async function inviteCustomerAction(formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const phone = formData.get("phone") as string;
  return registerCustomerAction(`${firstName} ${lastName}`, phone);
}

