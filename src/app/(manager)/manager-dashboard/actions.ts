"use server";

import { pointsService } from "@/lib/services/points-service";
import { customerService } from "@/lib/services/customer-service";

export async function getBranchTransactions() {
  try {
    const { pointsService } = await import("@/lib/services/points-service");
    return await pointsService.getBranchTransactions();
  } catch (error) {
    return [];
  }
}

export async function manualAdjustmentAction(customerId: string, amountKurusStr: string) {
  const amountKurus = parseInt(amountKurusStr, 10);
  if (isNaN(amountKurus) || amountKurus === 0) return { error: "Geçerli bir tutar giriniz." };

  try {
    return await pointsService.manualAdjustment(customerId, amountKurus);
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Bilinmeyen hata") };
  }
}

export async function getCustomers(query?: string) {
  try {
    return await customerService.getCustomers(query);
  } catch {
    return [];
  }
}

export async function updateCustomer(id: string, data: Record<string, unknown>) {
  try {
    return await customerService.updateCustomer(id, data);
  } catch (error: unknown) {
    throw new Error((error instanceof Error ? error.message : "Bilinmeyen hata"));
  }
}

export async function deleteCustomer(id: string) {
  try {
    return await customerService.deleteCustomer(id);
  } catch (error: unknown) {
    throw new Error((error instanceof Error ? error.message : "Bilinmeyen hata"));
  }
}

import { managerService } from "@/lib/services/manager-service";
import { db } from "@/db";
import { users, invitations, organizations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function getManagerProfile() {
  try {
    const { managerService } = await import("@/lib/services/manager-service");
    return await managerService.getMyBranchData();
  } catch (error) {
    console.warn("[ManagerAction Guard] ⚠️ Stale session profile fallback activated.");
    // Hydration'ı ve Promise.all'u kırmayacak güvenli boş shadow obje
    return { branchId: "", branchName: "Bilinmeyen Şube", orgId: "" };
  }
}

export async function addCustomerAction(firstName: string, lastName: string, phone: string, email: string) {
  try {
    if (!firstName?.trim() || !lastName?.trim() || !phone?.trim() || !email?.trim()) {
      return { success: false, error: "Ad, soyad, telefon ve e-posta adresi zorunludur." };
    }
    if (!email.includes("@")) {
      return { success: false, error: "Geçerli bir e-posta adresi giriniz." };
    }

    const { userId } = await auth();
    if (!userId) return { success: false, error: "Oturum bulunamadı." };

    const dbUserLocal = await db.select().from(users).where(eq(users.clerkId, userId)).get();
    if (!dbUserLocal) return { success: false, error: "Yönetici kaydı bulunamadı." };
    if (dbUserLocal.role !== "MANAGER" && dbUserLocal.role !== "BOSS" && dbUserLocal.role !== "SUPER_ADMIN") {
      return { success: false, error: "Yönetici yetkisi gereklidir." };
    }

    const profile = await managerService.getMyBranchData();
    if (!profile || !profile.orgId) return { success: false, error: "Şube organizasyon kimliği bulunamadı." };
    const orgId = profile.orgId;
    const branchId = profile.branchId;

    const res = await customerService.inviteCustomer({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      branchId,
      orgId,
      invitedById: dbUserLocal.id,
    });

    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Kayıt hatası";
    if (message === "PHONE_ALREADY_REGISTERED") {
      return { error: "Bu telefon numarası zaten sistemde kayıtlı." };
    }
    if (message === "PHONE_INVITATION_EXISTS") {
      return { error: "Bu telefon numarasına ait aktif bir davet zaten bulunuyor." };
    }
    if (message.includes("Geçersiz telefon") || message === "Geçersiz telefon numarası formatı") {
      return { error: "Geçersiz telefon numarası formatı. Lütfen 5XX XXX XX XX formatında giriniz." };
    }
    return { error: message };
  }
}

import { 
  getOrgMembers as getOrgMembersAction, 
  updateMemberName as updateMemberNameAction, 
  removeMember as removeMemberAction 
} from "@/app/(boss)/boss-dashboard/actions";

export async function getOrgMembers() {
  try {
    const { staffService } = await import("@/lib/services/staff-service");
    return await staffService.getOrgMembers();
  } catch (error) {
    return [];
  }
}

export async function updateMemberName(id: string, firstName: string, lastName: string) {
  return await updateMemberNameAction(id, firstName, lastName);
}

export async function removeMember(id: string) {
  return await removeMemberAction(id);
}

import { staffProfiles } from "@/db/schema";

export async function toggleStaffStatus(memberId: string, currentActive: boolean) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Oturum bulunamadı." };

    const dbUserLocal = await db.select().from(users).where(eq(users.clerkId, clerkUserId)).get();
    if (!dbUserLocal) return { error: "Yönetici kaydı bulunamadı." };
    if (dbUserLocal.role !== "MANAGER" && dbUserLocal.role !== "BOSS" && dbUserLocal.role !== "SUPER_ADMIN") {
      return { error: "Yetkisiz işlem." };
    }

    await db.update(staffProfiles)
      .set({ isActive: !currentActive })
      .where(eq(staffProfiles.userId, memberId));

    return { success: true };
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Durum güncelleme hatası") };
  }
}

