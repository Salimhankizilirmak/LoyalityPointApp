"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { identityService } from "@/lib/services/identity-service";
import { users, branches, organizations, invitations, loyaltyTransactions, customers, campaigns, loyaltyRules, qrCustomerRequests, staffProfiles } from "@/db/schema";
import { eq, and, or, like, desc, asc, gte, lte, gt, sql, type SQL } from "drizzle-orm";
import { loyaltyService } from "@/lib/services/loyalty-service";
import { staffService } from "@/lib/services/staff-service";
import { customerService } from "@/lib/services/customer-service";
import { randomBytes } from "crypto";

// ─── SHARED HELPERS ──────────────────────────────────────────────────────────

export async function resolveCashierContext() {
  const { userId } = await auth();
  if (!userId) throw new Error("Oturum bulunamadı.");

  const dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();
  if (!dbUser) throw new Error("Kullanıcı kaydı bulunamadı.");
  if (dbUser.role !== "CASHIER" && dbUser.role !== "MANAGER" && dbUser.role !== "BOSS" && dbUser.role !== "SUPER_ADMIN") {
    throw new Error("Bu işlem için kasiyer veya yönetici yetkisi gereklidir.");
  }

  // Aktif şube çerezinden branchId çöz
  const cookieStore = await cookies();
  let branchId = cookieStore.get("active_branch_id")?.value;

  // GÜVENLİK VE MANTIK: Kasiyer ise doğrudan kendi atanmış şubesini bul ve onu kullan!
  if (dbUser.role === "CASHIER" || dbUser.role === "MANAGER") {
     const profile = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, dbUser.id)).get();
     if (profile && profile.branchId) {
        branchId = profile.branchId; // Cookie manipüle edilmişse veya eskiyse ez!
     }
  }

  if (!branchId) throw new Error("Aktif şube bağlamı bulunamadı. Lütfen şube seçin.");

  // orgId çöz
  const branch = await db.select({ orgId: branches.orgId })
    .from(branches)
    .where(eq(branches.id, branchId))
    .get();
    
  if (!branch) {
    const cookieStore = await cookies();
    cookieStore.delete("active_branch_id");
    redirect("/dashboard");
  }

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
    console.error("[searchCustomerAction] Error:", error);
    return { error: "İşlem sırasında sistemsel bir hata oluştu. Lütfen şube yöneticinizle iletişime geçin." };
  }
}

/**
 * Yeni müşteri kaydı.
 * organizationId kasiyerin aktif bağlamından peşin çözülür – istemciden alınmaz.
 */
export async function registerCustomerAction(name: string | null | undefined, phoneNumber: string, email: string) {
  try {
    if (!name?.trim()) {
      return { success: false, error: "Müşteri adı zorunludur." };
    }
    if (!phoneNumber?.trim() || !email?.trim()) {
      return { success: false, error: "Telefon numarası ve e-posta adresi zorunludur." };
    }
    if (!email.includes("@")) {
      return { success: false, error: "Geçerli bir e-posta adresi giriniz." };
    }

    const { dbUser, branchId, orgId } = await resolveCashierContext();

    const safeName = name.trim();
    const parts = safeName.split(/\s+/);
    const firstName = parts.slice(0, -1).join(" ") || parts[0];
    const lastName = parts.length > 1 ? parts[parts.length - 1] : "";
    
    const res = await customerService.inviteCustomer({
      firstName,
      lastName,
      phone: phoneNumber.trim(),
      email: email.trim().toLowerCase(),
      branchId,
      orgId,
      invitedById: dbUser.id,
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/cashier-dashboard");

    return res;
  } catch (error: any) {
    console.error("[registerCustomerAction] Error:", error);
    const message = error?.message || "İşlem sırasında sistemsel bir hata oluştu. Lütfen şube yöneticinizle iletişime geçin.";
    if (message === "PHONE_ALREADY_REGISTERED") {
      return { success: false, error: "Bu telefon numarası zaten sistemde kayıtlı." };
    }
    if (message === "PHONE_INVITATION_EXISTS") {
      return { success: false, error: "Bu telefon numarasına ait aktif bir davet zaten bulunuyor." };
    }
    if (message.includes("Geçersiz telefon") || message === "Geçersiz telefon numarası formatı") {
      return { success: false, error: "Geçersiz telefon numarası formatı. Lütfen 5XX XXX XX XX formatında giriniz." };
    }
    return { success: false, error: message };
  }
}

/**
 * Puan Kazanma Eylemi (EARN).
 * Guard Katmanları:
 *  1. Negatif/sıfır tutar reddi (kuruş bazında)
 *  2. staffService.requireBranchAccess – kasiyerin aktif şubede yetkisi
 *  3. LoyaltyService ACID transaction
 */
export async function earnPointsAction(customerId: string, amountSpentInKurus: number, campaignId?: string) {
  try {
    // 1. Girdi Sınır Muhafızı
    if (!amountSpentInKurus || amountSpentInKurus <= 0) {
      return { error: "Tutar 0'dan büyük olmalıdır." };
    }

    const { dbUser, branchId } = await resolveCashierContext();

    // 2. Şube Yetki Muhafızı
    await staffService.requireBranchAccess(dbUser.id, dbUser.role, branchId);

    // 3. İşlem yürütme
    const result = await loyaltyService.earnPoints(branchId, dbUser.id, customerId, amountSpentInKurus, campaignId);
    return {
      success: true,
      message: `${result.pointsEarned} puan yüklendi!`,
      newTotal: result.newTotal,
    };
  } catch (error: unknown) {
    console.error("[earnPointsAction] Error:", error);
    return { error: "İşlem sırasında sistemsel bir hata oluştu. Lütfen şube yöneticinizle iletişime geçin." };
  }
}

/**
 * Puan Ekleme Eylemi (DIRECT).
 * Müşteriye alışverişten (sepet tutarı) bağımsız, doğrudan puan yükler.
 */
export async function addDirectPointsAction(customerId: string, pointsToAdd: number) {
  try {
    if (!pointsToAdd || pointsToAdd <= 0) {
      return { error: "Puan tutarı 0'dan büyük olmalıdır." };
    }

    const { dbUser, branchId } = await resolveCashierContext();
    await staffService.requireBranchAccess(dbUser.id, dbUser.role, branchId);

    const result = await loyaltyService.addDirectPoints(branchId, dbUser.id, customerId, pointsToAdd);
    return {
      success: true,
      message: `${result.pointsEarned} puan doğrudan yüklendi!`,
      newTotal: result.newTotal,
    };
  } catch (error: unknown) {
    console.error("[addDirectPointsAction] Error:", error);
    return { error: "Puan eklenirken sistemsel bir hata oluştu." };
  }
}

/**
 * Puan Harcama Eylemi (BURN).
 * Guard Katmanları:
 *  1. Negatif/sıfır puan reddi
 *  2. staffService.requireBranchAccess – kasiyerin aktif şubede yetkisi
 *  3. LoyaltyService ACID transaction (DB-level race guard dahil)
 */
function generateRefId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = randomBytes(6);
  let refId = "REF-";
  for (let i = 0; i < 6; i++) {
    refId += chars[bytes[i] % chars.length];
  }
  return refId;
}

async function generateUniqueRefId(
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  tx: any
): Promise<string> {
  let refId = "";
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 10) {
    refId = generateRefId();
    attempts++;
    
    const existing = await tx.select()
      .from(loyaltyTransactions)
      .where(like(loyaltyTransactions.description, `%${refId}%`))
      .get();
      
    if (!existing) {
      isUnique = true;
    }
  }
  
  if (!isUnique) {
    throw new Error("Benzersiz referans numarası üretilemedi.");
  }
  
  return refId;
}

/**
 * Puan Harcama Eylemi (BURN - Parçalı Tahsilat / Split Payment).
 * Guard Katmanları:
 *  1. Negatif/sıfır puan ve tutar reddi
 *  2. staffService.requireBranchAccess – kasiyerin aktif şubede yetkisi
 *  3. ACID Drizzle transaction ile 2 parçalı ledger kaydı
 */
export async function burnPointsAction(customerId: string, pointsToBurn: number, totalCartAmount: number) {
  try {
    // 1. Girdi Sınır Muhafızı
    if (!pointsToBurn || pointsToBurn <= 0) {
      return { error: "Puan tutarı 0'dan büyük olmalıdır." };
    }
    if (!totalCartAmount || totalCartAmount <= 0) {
      return { error: "Toplam alışveriş tutarı 0'dan büyük olmalıdır." };
    }
    if (pointsToBurn > totalCartAmount) {
      return { error: "Harcanacak puan toplam alışveriş tutarını aşamaz." };
    }

    const { dbUser, branchId } = await resolveCashierContext();

    // 2. Şube Yetki Muhafızı
    await staffService.requireBranchAccess(dbUser.id, dbUser.role, branchId);

    // 3. İşlem yürütme (ACID Transaction)
    const result = await db.transaction(async (tx) => {
      // Şubeden orgId çöz
      const branch = await tx.select({ orgId: branches.orgId })
        .from(branches)
        .where(eq(branches.id, branchId))
        .get();

      if (!branch) throw new Error("Şube bulunamadı.");
      const { orgId } = branch;

      // Müşteri puan bakiyesini doğrula
      const customer = await tx.select({
        totalPoints: customers.totalPoints,
        orgId: customers.organizationId,
      })
        .from(customers)
        .where(eq(customers.id, customerId))
        .get();

      if (!customer) throw new Error("Müşteri bulunamadı.");

      // Cross-Tenant Guard
      if (customer.orgId !== orgId) {
        throw new Error("Güvenlik İhlali: Müşteri bu organizasyona ait değil.");
      }

      // Insufficient Balance Guard
      if (customer.totalPoints < pointsToBurn) {
        throw new Error(
          `Müşterinin puan bakiyesi bu işlem için yetersizdir. Mevcut: ${customer.totalPoints}, Gerekli: ${pointsToBurn}`
        );
      }

      // Atomik Puan Güncellemesi (Race Condition Guard)
      const updated = await tx
        .update(customers)
        .set({ totalPoints: sql`${customers.totalPoints} - ${pointsToBurn}` })
        .where(
          and(
            eq(customers.id, customerId),
            gte(customers.totalPoints, pointsToBurn)
          )
        )
        .returning({ newTotal: customers.totalPoints });

      if (!updated[0]) {
        throw new Error("Müşterinin puan bakiyesi bu işlem için yetersizdir.");
      }

      // Kriptografik benzersiz referans ID
      const refId = await generateUniqueRefId(tx);

      // Kalan nakit/kart tahsilat tutarı (kuruş cinsinden)
      const remainingAmount = Math.max(0, totalCartAmount - pointsToBurn);
      const remainingKurus = Math.round(remainingAmount * 100);

      // KAYIT 1 (Redeem): type='BURN', points=-[HARCANAN_PUAN]
      const burnDesc = `${refId} nolu ${totalCartAmount} TL tutarındaki alışveriş için ${pointsToBurn} sadakat puanı harcandı.`;
      await tx.insert(loyaltyTransactions).values({
        organizationId: orgId,
        branchId,
        customerId,
        cashierId: dbUser.id,
        type: "BURN",
        amountSpent: 0,
        pointsAmount: -pointsToBurn,
        description: burnDesc,
        status: "SUCCESS",
      });

      // KAYIT 2 (Settlement): type='CASH_SETTLEMENT', points=0, amountSpent=remainingKurus
      const settlementDesc = `${refId} nolu ${totalCartAmount} TL tutarındaki alışverişin puan harcaması sonrası kalan ${remainingAmount} TL tutarı nakit/kart olarak tahsil edildi.`;
      await tx.insert(loyaltyTransactions).values({
        organizationId: orgId,
        branchId,
        customerId,
        cashierId: dbUser.id,
        type: "CASH_SETTLEMENT",
        amountSpent: remainingKurus,
        pointsAmount: 0,
        description: settlementDesc,
        status: "SUCCESS",
      });

      return {
        pointsBurned: pointsToBurn,
        newTotal: updated[0].newTotal,
        refId,
        remainingAmount
      };
    });

    return {
      success: true,
      message: `${result.pointsBurned} puan harcandı, kalan tutar tahsil edildi!`,
      newTotal: result.newTotal,
      refId: result.refId,
      remainingAmount: result.remainingAmount
    };
  } catch (error: unknown) {
    console.error("[burnPointsAction] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "İşlem sırasında sistemsel bir hata oluştu. Lütfen şube yöneticinizle iletişime geçin.";
    return { error: errorMessage };
  }
}

/**
 * Şube aktif durumu denetimi (30 sn polling için).
 */
export async function getBranchStatus(): Promise<{ isActive: boolean; isDeleted: boolean }> {
  try {
    const { userId } = await auth();
    if (!userId) return { isActive: false, isDeleted: true };

    const { staffProfiles } = await import("@/db/schema");

    // ─── B2B COMPLIANCE GUARD: Tek gerçek kaynak veritabanı profilidir ───
    const staffProfile = await db.select({
      branchId: staffProfiles.branchId
    })
    .from(staffProfiles)
    .innerJoin(users, eq(staffProfiles.userId, users.id))
    .where(eq(users.clerkId, userId))
    .get();

    if (!staffProfile || !staffProfile.branchId) {
      console.error(`[getBranchStatus] ❌ No valid staff profile or branch assignment found for clerk user: ${userId}`);
      return { isActive: false, isDeleted: true };
    }

    // Sorgulamayı kesinlikle çerezden gelen veriyle değil, DB'deki gerçek şube ID'si ile yap
    const branch = await db.select({
      isActive: branches.isActive,
      orgId: branches.orgId,
    })
    .from(branches)
    .where(eq(branches.id, staffProfile.branchId))
    .get();

    if (!branch) return { isActive: false, isDeleted: true };

    const org = await db.select({ isActive: organizations.isActive })
      .from(organizations)
      .where(eq(organizations.id, branch.orgId))
      .get();

    // Çerez kontrolü: Eğer çerezdeki veri veritabanındaki ile uyuşmuyorsa
    // Server Component aşamasında çerez yazılamaz (Next.js kısıtlaması). 
    // Bunun yerine, veritabanından çekilen staffProfile.branchId "Single Source of Truth" olarak güvenilirdir.
    // İleride çereze ihtiyaç duyulursa Middleware veya Login Route Handler üzerinden set edilmelidir.

    return {
      isActive: (branch.isActive && (org?.isActive ?? false)),
      isDeleted: false,
    };
  } catch (error) {
    console.error("[getBranchStatus Error]:", error);
    return { isActive: false, isDeleted: true };
  }
}

/**
 * Şubenin son mali işlemlerini (Audit Trail) listeler.
 * - staffService.requireBranchAccess yetkilendirmesi action kapısında gerçekleştirilir.
 * - Zaman damgası hydration hatalarını önlemek için Europe/Istanbul dilimine sunucu tarafında sabitlenir.
 */
export async function getRecentBranchTransactionsAction(limit: number = 10, page: number = 1) {
  try {
    const { dbUser, branchId } = await resolveCashierContext();
    
    // 1. Yetki Kontrolü Action Kapısında Yapılır
    await staffService.requireBranchAccess(dbUser.id, dbUser.role, branchId);

    const offset = (page - 1) * limit;

    // 2. Servis Katmanı Çağrısı (Sadece doğrulanmış branchId paslanır)
    const rawTransactions = await loyaltyService.getRecentTransactions(branchId, limit, offset);

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
        status: tx.status,
        parentTransactionId: tx.parentTransactionId,
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
      error: "İşlem sırasında sistemsel bir hata oluştu. Lütfen şube yöneticinizle iletişime geçin.",
    };
  }
}

/**
 * Bir işlemi iptal eder (Void/Reversal).
 */
export async function voidTransactionAction(transactionId: string) {
  try {
    const { dbUser, branchId } = await resolveCashierContext();
    
    // Şube yetki muhafızı doğrulaması
    await staffService.requireBranchAccess(dbUser.id, dbUser.role, branchId);

    // Servis katmanından işlemi iptal et
    const result = await loyaltyService.voidTransaction(transactionId, dbUser.id);

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/cashier-dashboard");
    revalidatePath("/cashier-dashboard/transactions");

    return { success: true, newTotal: result.newTotal };
  } catch (error: unknown) {
    console.error("[voidTransactionAction] Error:", error);
    return {
      success: false,
      error: "İşlem sırasında sistemsel bir hata oluştu. Lütfen şube yöneticinizle iletişime geçin.",
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
  const email = formData.get("email") as string;
  return registerCustomerAction(`${firstName} ${lastName}`, phone, email);
}

/**
 * Kasiyer için gelişmiş işlem sorgulama, filtreleme, sıralama ve sayfalama eylemi.
 * Şube bazlı RBAC (Role-Based Access Control) Gating ile korunmaktadır.
 */
export async function getFilteredTransactionsAction(filters: {
  query?: string;
  startDate?: number;
  endDate?: number;
  type?: "EARN" | "BURN" | "VOID" | "ALL";
  status?: "SUCCESS" | "VOIDED" | "ALL";
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  customerId?: string;
}) {
  try {
    const { dbUser, branchId } = await resolveCashierContext();
    
    // Şube bazlı RBAC Gating koruması
    await staffService.requireBranchAccess(dbUser.id, dbUser.role, branchId);

    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    // Kasiyerin kendi organizasyonunun dışına çıkmasını engellemek için aktif şubenin orgId bilgisini bul
    const currentBranch = await db.select({ orgId: branches.orgId }).from(branches).where(eq(branches.id, branchId)).get();
    const currentOrgId = currentBranch?.orgId || "";

    // Son 6 aya ait milisaniye zaman damgası hesabı (Performans Guard)
    const sixMonthsAgoMs = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;

    // Sorgu koşullarını organizasyon izolasyonu ve zaman guardı ile başlat
    const conditions: SQL[] = [
      eq(invitations.organizationId, currentOrgId),
      eq(invitations.role, "CUSTOMER"),
      or(
        gt(loyaltyTransactions.createdAt, new Date(sixMonthsAgoMs)),
        sql`${loyaltyTransactions.id} IS NULL`
      ) as SQL
    ];

    if (filters.customerId && filters.customerId.trim() !== "") {
      conditions.push(eq(loyaltyTransactions.customerId, filters.customerId.trim()));
    }

    if (filters.query && filters.query.trim() !== "") {
      const q = `%${filters.query.trim()}%`;
      const orCond = or(
        like(customers.name, q),
        like(invitations.email, q),
        like(invitations.phoneNumber, q),
        like(users.name, q)
      );
      if (orCond) {
        conditions.push(orCond);
      }
    }

    if (filters.startDate !== undefined && filters.startDate !== null) {
      conditions.push(gte(loyaltyTransactions.createdAt, new Date(filters.startDate)));
    }
    if (filters.endDate !== undefined && filters.endDate !== null) {
      conditions.push(lte(loyaltyTransactions.createdAt, new Date(filters.endDate)));
    }

    if (filters.type && filters.type !== "ALL") {
      conditions.push(eq(loyaltyTransactions.type, filters.type));
    }

    if (filters.status && filters.status !== "ALL") {
      conditions.push(eq(loyaltyTransactions.status, filters.status));
    }

    const queryCondition = and(...conditions);

    // Dinamik Sıralama
    let orderByColumn;
    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "desc";

    if (sortBy === "pointsAmount") {
      orderByColumn = sortOrder === "asc" ? asc(loyaltyTransactions.pointsAmount) : desc(loyaltyTransactions.pointsAmount);
    } else if (sortBy === "amountSpent") {
      orderByColumn = sortOrder === "asc" ? asc(loyaltyTransactions.amountSpent) : desc(loyaltyTransactions.amountSpent);
    } else if (sortBy === "customerName") {
      orderByColumn = sortOrder === "asc" ? asc(customers.name) : desc(customers.name);
    } else {
      orderByColumn = sortOrder === "asc" ? asc(invitations.createdAt) : desc(invitations.createdAt);
    }

    // 1. Dinamik LeftJoin Sorgusu
    const rawTransactions = await db
      .select({
        id: loyaltyTransactions.id,
        organizationId: loyaltyTransactions.organizationId,
        branchId: loyaltyTransactions.branchId,
        customerId: loyaltyTransactions.customerId,
        cashierId: loyaltyTransactions.cashierId,
        type: loyaltyTransactions.type,
        amountSpent: loyaltyTransactions.amountSpent,
        pointsAmount: loyaltyTransactions.pointsAmount,
        status: loyaltyTransactions.status,
        parentTransactionId: loyaltyTransactions.parentTransactionId,
        createdAt: loyaltyTransactions.createdAt,
        customerName: customers.name,
        customerPhone: customers.phoneNumber,
        cashierName: users.name,
        cashierClerkId: users.clerkId,
        cashierEmail: users.email,
        customerEmail: invitations.email,
        invitationPhone: invitations.phoneNumber,
        invitationStatus: invitations.status,
        invitationCreatedAt: invitations.createdAt,
        customerCreatedAt: customers.createdAt,
      })
      .from(invitations)
      .leftJoin(users, eq(invitations.email, users.email))
      .leftJoin(customers, eq(customers.phoneNumber, sql`'0' || substr(${invitations.phoneNumber}, -10)`))
      .leftJoin(loyaltyTransactions, eq(customers.id, loyaltyTransactions.customerId))
      .where(queryCondition)
      .orderBy(orderByColumn)
      .limit(limit)
      .offset(offset)
      .all();

    // 2. Toplam kayıt sayısı (Sayfalama kontrolleri için)
    const countResult = await db
      .select({ count: sql<number>`count(${invitations.id})` })
      .from(invitations)
      .leftJoin(users, eq(invitations.email, users.email))
      .leftJoin(customers, eq(customers.phoneNumber, sql`'0' || substr(${invitations.phoneNumber}, -10)`))
      .leftJoin(loyaltyTransactions, eq(customers.id, loyaltyTransactions.customerId))
      .where(queryCondition)
      .get();

    const totalCount = countResult?.count ?? 0;

    const formatter = new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      dateStyle: "short",
      timeStyle: "short",
    });

    const transactions = rawTransactions.map((tx) => ({
      id: tx.id || `temp-invite-${tx.invitationPhone || tx.customerEmail}`,
      organizationId: tx.organizationId || currentOrgId,
      branchId: tx.branchId || branchId,
      customerId: tx.customerId || "",
      cashierId: tx.cashierId || "",
      type: tx.type || "EARN",
      amountSpent: tx.amountSpent,
      pointsAmount: tx.pointsAmount || 0,
      status: tx.status || "SUCCESS",
      parentTransactionId: tx.parentTransactionId,
      createdAtFormatted: tx.createdAt 
        ? formatter.format(tx.createdAt) 
        : tx.invitationStatus === "ACCEPTED" && tx.customerCreatedAt 
          ? formatter.format(tx.customerCreatedAt) 
          : tx.invitationCreatedAt 
            ? formatter.format(tx.invitationCreatedAt) 
            : "",
      customerName: tx.customerName || tx.customerEmail.split("@")[0],
      customerPhone: tx.customerPhone || tx.invitationPhone || "Belirtilmemiş",
      cashierName: tx.cashierName || tx.cashierEmail || "Sistem",
      cashierEmail: tx.cashierEmail ?? "Belirtilmemiş",
    }));

    return { success: true, transactions, totalCount };
  } catch (error: unknown) {
    console.error("[getFilteredTransactionsAction] Error:", error);
    return {
      success: false,
      error: "İşlem sırasında sistemsel bir hata oluştu. Lütfen şube yöneticinizle iletişime geçin.",
    };
  }
}

/**
 * Müşterinin son işlemlerini leftJoin ile güvenli şekilde çekip listeler.
 */
export async function getCustomerRecentTransactionsAction(customerId: string, limit: number = 5) {
  try {
    const { dbUser, branchId } = await resolveCashierContext();
    
    // Yetki kontrolü
    await staffService.requireBranchAccess(dbUser.id, dbUser.role, branchId);

    const rawTransactions = await db
      .select({
        id: loyaltyTransactions.id,
        organizationId: loyaltyTransactions.organizationId,
        branchId: loyaltyTransactions.branchId,
        customerId: loyaltyTransactions.customerId,
        cashierId: loyaltyTransactions.cashierId,
        type: loyaltyTransactions.type,
        amountSpent: loyaltyTransactions.amountSpent,
        pointsAmount: loyaltyTransactions.pointsAmount,
        status: loyaltyTransactions.status,
        parentTransactionId: loyaltyTransactions.parentTransactionId,
        createdAt: loyaltyTransactions.createdAt,
      })
      .from(loyaltyTransactions)
      .where(
        and(
          eq(loyaltyTransactions.customerId, customerId),
          eq(loyaltyTransactions.branchId, branchId)
        )
      )
      .orderBy(desc(loyaltyTransactions.createdAt))
      .limit(limit)
      .all();

    const formatter = new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      dateStyle: "short",
      timeStyle: "short",
    });

    const transactions = rawTransactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amountSpent: tx.amountSpent,
      pointsAmount: tx.pointsAmount,
      status: tx.status,
      parentTransactionId: tx.parentTransactionId,
      createdAtFormatted: formatter.format(tx.createdAt),
    }));

    return { success: true, transactions };
  } catch (error: unknown) {
    console.error("[getCustomerRecentTransactionsAction] Error:", error);
    return {
      success: false,
      error: "Müşteri işlem geçmişi alınamadı. Lütfen tekrar deneyin.",
    };
  }
}

export async function getCashierPendingInvitationsAction() {
  try {
    const { branchId } = await resolveCashierContext();
    const pendingInvites = await db.select()
      .from(invitations)
      .where(and(eq(invitations.branchId, branchId), eq(invitations.status, "PENDING")))
      .all();
    return { success: true, invitations: pendingInvites };
  } catch (error) {
    return { success: false, invitations: [] };
  }
}

export async function getCashierAcceptedCustomersAction() {
  try {
    const { branchId, orgId: organizationId } = await resolveCashierContext();
    
    const result = await db
      .select({
        id: customers.id,
        name: customers.name,
        phoneNumber: customers.phoneNumber,
        totalPoints: customers.totalPoints,
        createdAt: customers.createdAt,
      })
      .from(invitations)
      .innerJoin(customers, eq(customers.phoneNumber, sql`'0' || substr(${invitations.phoneNumber}, -10)`))
      .where(and(
        eq(invitations.branchId, branchId),
        eq(invitations.role, "CUSTOMER"),
        eq(invitations.status, "ACCEPTED"),
        eq(customers.organizationId, organizationId)
      ))
      .all();

    const serialized = result.map((item) => ({
      ...item,
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
    }));

    return { success: true, customers: serialized };
  } catch (error) {
    return { success: false, customers: [] };
  }
}

export async function getBranchCustomerInvitationsAction() {
  console.log('GET BRANCH CUSTOMER INVITATIONS ACTION TRIGGERED!');
  try {
    const { orgId } = await resolveCashierContext();

    // Sadece bu organizasyona ait olanları getir
    // (Customer tablosundaki orgId'ye göre)
    const result = await db
      .select({
        id: customers.id,
        phoneNumber: customers.phoneNumber,
        status: sql<string>`'ACCEPTED'`,
        createdAt: customers.createdAt,
        customerName: customers.name,
        totalPoints: customers.totalPoints,
      })
      .from(customers)
      .where(eq(customers.organizationId, orgId))
      .all();

    const allInvites = await db
      .select({
        email: invitations.email,
        phoneNumber: invitations.phoneNumber,
      })
      .from(invitations)
      .where(eq(invitations.organizationId, orgId))
      .all();

    const formatted = result.map(cust => {
      const custPhone = cust.phoneNumber.replace(/\D/g, '').slice(-10);
      const invite = allInvites.find(inv => (inv.phoneNumber || "").replace(/\D/g, '').slice(-10) === custPhone);

      return {
        ...cust,
        createdAt: cust.createdAt ? new Date(cust.createdAt).toISOString() : new Date().toISOString(),
        email: invite?.email || "Belirtilmemiş",
      };
    });

    return { success: true, invitations: formatted };
  } catch (error: any) {
    console.error("[getBranchCustomerInvitationsAction] Error:", error);
    return { success: false, error: "Müşteriler yüklenirken bir hata oluştu." };
  }
}

export async function getTransactionsWithCustomers(page: number = 1) {
  try {
    const { branchId, orgId } = await resolveCashierContext();
    const limitVal = 20;
    const offsetVal = (page - 1) * limitVal;

    const result = await db
      .select({
        id: customers.id,
        name: customers.name,
        phoneNumber: customers.phoneNumber,
        totalPoints: customers.totalPoints,
        createdAt: customers.createdAt,
      })
      .from(invitations)
      .innerJoin(customers, eq(customers.phoneNumber, sql`'0' || substr(${invitations.phoneNumber}, -10)`))
      .where(and(
        eq(invitations.branchId, branchId),
        eq(invitations.role, "CUSTOMER"),
        eq(invitations.status, "ACCEPTED"),
        eq(customers.organizationId, orgId)
      ))
      .limit(limitVal)
      .offset(offsetVal)
      .all();

    const serialized = result.map((item) => ({
      ...item,
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
    }));

    return { success: true, customers: serialized };
  } catch (error) {
    return { success: false, customers: [] };
  }
}

/**
 * Kasiyerin günlük ve toplam performans istatistiklerini getirir.
 * - todayTxCount: O gün yaptığı işlem sayısı
 * - todayNewCustomers: O gün eklediği/davet ettiği müşteri sayısı
 * - totalTxCount: Toplam işlem sayısı
 * - totalRevenue: Toplam kazanç (kuruş cinsinden)
 */
export async function getCashierStatsAction() {
  try {
    const { dbUser, branchId, orgId } = await resolveCashierContext();
    
    // Türkiye saati (UTC+3) baz alınarak günün başlangıcı (00:00) hesaplanıyor
    const now = new Date();
    const istanbulOffsetMs = 3 * 60 * 60 * 1000;
    const nowIstanbul = new Date(now.getTime() + istanbulOffsetMs);
    nowIstanbul.setUTCHours(0, 0, 0, 0);
    const startOfToday = new Date(nowIstanbul.getTime() - istanbulOffsetMs);

    // a) O gün yaptığı işlem sayısı (todayTxCount)
    const todayTxCountResult = await db
      .select({ count: sql<number>`count(${loyaltyTransactions.id})` })
      .from(loyaltyTransactions)
      .where(
        and(
          eq(loyaltyTransactions.cashierId, dbUser.id),
          eq(loyaltyTransactions.branchId, branchId),
          gte(loyaltyTransactions.createdAt, startOfToday)
        )
      )
      .get();
      
    // b) O gün eklenen yeni müşteri sayısı (todayNewCustomers)
    // Kasiyerin (invitedBy) oluşturduğu davetler üzerinden hesaplıyoruz.
    const todayNewCustomersResult = await db
      .select({ count: sql<number>`count(${invitations.id})` })
      .from(invitations)
      .where(
        and(
          eq(invitations.invitedBy, dbUser.id),
          eq(invitations.branchId, branchId),
          gte(invitations.createdAt, startOfToday)
        )
      )
      .get();

    // c) Toplam yaptığı işlem sayısı veya tutarı (totalTx)
    const totalTxResult = await db
      .select({
        count: sql<number>`count(${loyaltyTransactions.id})`,
        revenue: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyTransactions.type} = 'EARN' THEN ${loyaltyTransactions.pointsAmount} ELSE 0 END), 0)`,
        burned: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyTransactions.type} = 'BURN' THEN ${loyaltyTransactions.pointsAmount} ELSE 0 END), 0)`
      })
      .from(loyaltyTransactions)
      .where(
        and(
          eq(loyaltyTransactions.cashierId, dbUser.id),
          eq(loyaltyTransactions.branchId, branchId),
          gte(loyaltyTransactions.createdAt, startOfToday)
        )
      )
      .get();

    // d) Yönetici Puan Kuralları
    const loyaltyRule = await db
      .select({
        earnRatio: loyaltyRules.earnRatio,
        pointsEquivalent: loyaltyRules.pointsEquivalent,
        tlEquivalent: loyaltyRules.tlEquivalent,
      })
      .from(loyaltyRules)
      .where(eq(loyaltyRules.organizationId, orgId))
      .get();
      
    // e) Şube Kuralları
    const branch = await db
      .select({ defaultEarnRatio: branches.defaultEarnRatio })
      .from(branches)
      .where(eq(branches.id, branchId))
      .get();

    return {
      success: true,
      stats: {
        todayTxCount: todayTxCountResult?.count || 0,
        todayNewCustomers: todayNewCustomersResult?.count || 0,
        totalTxCount: totalTxResult?.count || 0,
        totalRevenue: totalTxResult?.revenue || 0,
        totalBurned: totalTxResult?.burned || 0,
        earnRatio: branch?.defaultEarnRatio ?? loyaltyRule?.earnRatio ?? 10,
        pointsEquivalent: loyaltyRule?.pointsEquivalent || 1,
        tlEquivalent: loyaltyRule?.tlEquivalent || 1
      }
    };

  } catch (error: unknown) {
    console.error("[getCashierStatsAction] Error:", error);
    return { success: false, error: "İstatistikler alınırken bir hata oluştu." };
  }
}


export async function getActiveCampaignForCashierAction() {
  try {
    const { branchId } = await resolveCashierContext();
    const now = new Date();
    
    // First active campaign
    const campaign = await db.select({ 
      id: campaigns.id,
      name: campaigns.name,
      campaignType: campaigns.campaignType,
      earnRatio: campaigns.earnRatio,
      tiers: campaigns.tiers
    })
    .from(campaigns)
    .where(
      and(
        eq(campaigns.branchId, branchId),
        eq(campaigns.isActive, true),
        lte(campaigns.startDate, now),
        gte(campaigns.endDate, now)
      )
    )
    .get();

    return { success: true, campaign };
  } catch (err) {
    return { success: false };
  }
}


export async function updateCustomerNameAction(phoneNumber: string, newName: string) {
  try {
    const { orgId } = await resolveCashierContext();
    if (!phoneNumber || !newName || newName.trim().length === 0) {
      return { success: false, error: "Geçersiz veriler." };
    }

    const result = await identityService.syncUserName({
      phoneNumber,
      orgId,
      newName
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (err) {
    console.error("Müşteri ismi güncellenirken hata:", err);
    return { success: false, error: "İsim güncellenemedi." };
  }
}

export async function getEarnConfigAction() {
  try {
    const { branchId, dbUser, orgId } = await resolveCashierContext();
    const now = new Date();
    
    const branch = await db.select({ defaultEarnRatio: branches.defaultEarnRatio }).from(branches).where(eq(branches.id, branchId)).get();
    const orgRule = await db.select({ 
      earnRatio: loyaltyRules.earnRatio,
      pointsEquivalent: loyaltyRules.pointsEquivalent,
      tlEquivalent: loyaltyRules.tlEquivalent
    }).from(loyaltyRules).where(eq(loyaltyRules.organizationId, orgId)).get();

    const activeCampaigns = await db.select({
      id: campaigns.id,
      name: campaigns.name,
      earnRatio: campaigns.earnRatio,
      campaignType: campaigns.campaignType,
      tiers: campaigns.tiers
    }).from(campaigns).where(
      and(
        eq(campaigns.branchId, branchId),
        eq(campaigns.isActive, true),
        lte(campaigns.startDate, now),
        gte(campaigns.endDate, now)
      )
    ).all();

    return {
      success: true,
      data: {
        defaultEarnRatio: branch?.defaultEarnRatio ?? orgRule?.earnRatio ?? 10,
        pointsEquivalent: orgRule?.pointsEquivalent ?? 1,
        tlEquivalent: orgRule?.tlEquivalent ?? 1,
        campaigns: activeCampaigns
      }
    };
  } catch (error: any) {
    console.error("[getEarnConfigAction] Error:", error);
    return { success: false, error: "Ayarlar alınırken hata oluştu." };
  }
}


export async function getPendingQrRequestsAction() {
  try {
    const { branchId, orgId } = await resolveCashierContext();
    
    const requests = await db.select()
      .from(qrCustomerRequests)
      .where(and(
         eq(qrCustomerRequests.branchId, branchId),
         eq(qrCustomerRequests.status, "PENDING")
      ))
      .orderBy(desc(qrCustomerRequests.createdAt))
      .all();
      
    return { success: true, data: requests };
  } catch (error) {
    console.error("getPendingQrRequestsAction Error:", error);
    return { success: false, error: "İstekler alınamadı." };
  }
}

export async function approveQrRequestAction(requestId: string) {
  try {
    const { dbUser, branchId, orgId } = await resolveCashierContext();
    
    const request = await db.select()
      .from(qrCustomerRequests)
      .where(and(
         eq(qrCustomerRequests.id, requestId),
         eq(qrCustomerRequests.branchId, branchId)
      )).get();
      
    if (!request) return { success: false, error: "İstek bulunamadı veya yetkisiz erişim." };
    
    // Use the existing registerCustomerAction logic or customerService directly
    const res = await customerService.inviteCustomer({
      firstName: request.firstName,
      lastName: request.lastName,
      phone: request.phoneNumber,
      email: request.email,
      branchId,
      orgId,
      invitedById: dbUser.id,
    });
    
    if (!res.success) {
      // @ts-ignore
      return { success: false, error: res.message || res.error || "Müşteri davet edilirken hata oluştu." };
    }
    
    // Update request status to APPROVED
    await db.update(qrCustomerRequests)
      .set({ 
        status: "APPROVED",
        clerkTicketUrl: "" // System sends sms/email automatically
      })
      .where(eq(qrCustomerRequests.id, requestId))
      .run();
      
    return { success: true, url: "" };
  } catch (error: any) {
    console.error("approveQrRequestAction Error:", error);
    return { success: false, error: error?.message || "Onaylama sırasında hata oluştu." };
  }
}

export async function rejectQrRequestAction(requestId: string) {
  try {
    const { branchId } = await resolveCashierContext();
    
    await db.update(qrCustomerRequests)
      .set({ status: "REJECTED" })
      .where(and(
         eq(qrCustomerRequests.id, requestId),
         eq(qrCustomerRequests.branchId, branchId)
      ))
      .run();
      
    return { success: true };
  } catch (error) {
    console.error("rejectQrRequestAction Error:", error);
    return { success: false, error: "Reddetme işlemi başarısız." };
  }
}
