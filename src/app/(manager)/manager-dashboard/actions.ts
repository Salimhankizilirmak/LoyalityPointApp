"use server";

import { pointsService } from "@/lib/services/points-service";
import { customerService } from "@/lib/services/customer-service";

export async function getBranchTransactions() {
  try {
    return await pointsService.getBranchTransactions();
  } catch {
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
import { users, invitations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function getManagerProfile() {
  return await managerService.getMyBranchData();
}

export async function addCustomerAction(firstName: string, lastName: string, phone: string, email: string) {
  try {
    if (!firstName?.trim() || !lastName?.trim() || !phone?.trim() || !email?.trim()) {
      return { error: "Ad, soyad, telefon ve e-posta adresi zorunludur." };
    }
    if (!email.includes("@")) {
      return { error: "Geçerli bir e-posta adresi giriniz." };
    }

    const { userId } = await auth();
    if (!userId) return { error: "Oturum bulunamadı." };

    const dbUserLocal = await db.select().from(users).where(eq(users.clerkId, userId)).get();
    if (!dbUserLocal) return { error: "Yönetici kaydı bulunamadı." };
    if (dbUserLocal.role !== "MANAGER" && dbUserLocal.role !== "BOSS" && dbUserLocal.role !== "SUPER_ADMIN") {
      return { error: "Yönetici yetkisi gereklidir." };
    }

    const profile = await managerService.getMyBranchData();
    if (!profile || !profile.orgId) return { error: "Şube organizasyon kimliği bulunamadı." };
    const orgId = profile.orgId;
    const branchId = profile.branchId;

    // Mükerrer davetiye kontrolü (Guard Clause)
    const existingPending = await db.select()
      .from(invitations)
      .where(and(
        eq(invitations.email, email.trim().toLowerCase()),
        eq(invitations.status, "PENDING")
      ))
      .get();

    if (existingPending) {
      return { error: "Bu e-posta adresi için zaten bekleyen bir davet mevcut." };
    }

    const client = await clerkClient();
    const invitation = await client.invitations.createInvitation({
      emailAddress: email.trim().toLowerCase(),
      publicMetadata: {
        role: "customer",
        branchId,
        orgId,
      },
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sign-up`,
    });

    await db.insert(invitations).values({
      clerkInviteId: invitation.id,
      email: email.trim().toLowerCase(),
      phoneNumber: phone.trim(),
      organizationId: orgId,
      branchId,
      role: "CUSTOMER",
      status: "PENDING",
      invitedBy: dbUserLocal.id,
    });

    return { success: true };
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Kayıt hatası") };
  }
}

import { 
  getOrgMembers as getOrgMembersAction, 
  updateMemberName as updateMemberNameAction, 
  removeMember as removeMemberAction 
} from "@/app/(boss)/boss-dashboard/actions";

export async function getOrgMembers() {
  return await getOrgMembersAction();
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

