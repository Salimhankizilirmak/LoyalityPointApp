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
import { users, customerProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function getManagerProfile() {
  return await managerService.getMyBranchData();
}

export async function addCustomerAction(firstName: string, lastName: string, phone: string) {
  try {
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

    const mockClerkId = `mock_${phone}`;
    const mockEmail = `${phone}@mock.com`;

    const existingUser = await db.select().from(users).where(eq(users.clerkId, mockClerkId)).get();
    if (existingUser) {
      return { error: "Bu telefon numarasıyla kayıtlı bir müşteri zaten mevcut." };
    }

    await db.transaction(async (tx) => {
      const insertedUser = await tx.insert(users).values({
        clerkId: mockClerkId,
        email: mockEmail,
        role: "CUSTOMER",
        name: `${firstName} ${lastName}`,
      }).returning();

      await tx.insert(customerProfiles).values({
        userId: insertedUser[0].id,
        orgId: orgId,
        currentPoints: 0,
      });
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

