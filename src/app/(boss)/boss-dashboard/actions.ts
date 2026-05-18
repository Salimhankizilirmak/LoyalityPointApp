"use server";

import { organizationService } from "@/lib/services/organization-service";
import { staffService as memberService } from "@/lib/services/staff-service";
import { clerkClient } from "@clerk/nextjs/server";

// Organization Services
export async function getAllBossOrganizations() {
  return await organizationService.getAllBossOrganizations();
}

export async function getBranches() {
  return await organizationService.getBranches();
}

export async function getBossProfile() {
  return await organizationService.getBossProfile();
}

export async function updateOrgSettings(pointRate: number, validityMonths: number) {
  return await organizationService.updateSettings(pointRate, validityMonths);
}

export async function createBranch(name: string, city: string) {
  return await organizationService.createBranch(name, city);
}

export async function updateOrgName(newName: string) {
  return await organizationService.updateName(newName);
}

export async function deleteOrganization(id: string) {
  return await organizationService.deleteOrganization(id);
}

export async function deleteBranch(id: string) {
  return await organizationService.deleteBranch(id);
}

export async function toggleBranchStatus(id: string) {
  return await organizationService.toggleStatus(id);
}

// Member Services
export async function getOrgMembers() {
  return await memberService.getOrgMembers();
}

export async function inviteEmployee(data: { name: string; email: string; role: "manager" | "cashier"; branch: string; org_id?: string }) {
  try {
    return await memberService.inviteEmployee(data);
  } catch (error: unknown) {
    const err = error as { errors?: { message: string }[]; message?: string };
    const message = err.errors?.[0]?.message || err.message || "Bilinmeyen hata";
    console.error("[Invite Action Error]:", message, error);
    throw new Error(message);
  }
}

export async function updateMemberName(memberId: string, firstName: string, lastName: string) {
  return await memberService.updateMemberName(memberId, firstName, lastName);
}

export async function removeMember(memberId: string) {
  return await memberService.removeMember(memberId);
}

export async function reassignManager(memberId: string, newBranchName: string, newOrgId: string) {
  return await memberService.reassignManager(memberId, newBranchName, newOrgId);
}

// User Profile
export async function updateBossName(firstName: string, lastName: string) {
  const client = await clerkClient();
  // This could also be in a UserService if needed, for now keeping it simple
  const { userId } = await (await import("@clerk/nextjs/server")).auth();
  if (!userId) throw new Error("Yetkisiz");
  await client.users.updateUser(userId, { firstName, lastName });
  return { success: true };
}

// Yeni: Aşama 3.3 Metadata Tabanlı Davet Pipeline'ı
export async function inviteStaffAction(email: string, role: "CASHIER" | "MANAGER", branchIds: string[]) {
  try {
    const { userId } = await (await import("@clerk/nextjs/server")).auth();
    if (!userId) throw new Error("Oturum bulunamadı");
    
    // 1. Boss Authorization Guard
    const { db } = await import("@/db");
    const { users, organizations, branches } = await import("@/db/schema");
    const { eq, inArray } = await import("drizzle-orm");
    
    const boss = await db.select().from(users).where(eq(users.clerkId, userId)).get();
    if (!boss || boss.role !== "BOSS") {
      throw new Error("Sadece yetkili patronlar personel davet edebilir.");
    }
    
    const org = await db.select().from(organizations).where(eq(organizations.bossId, boss.id)).get();
    if (!org) {
      throw new Error("Organizasyon bulunamadı.");
    }
    
    if (branchIds.length > 0) {
      const targetBranches = await db.select().from(branches).where(inArray(branches.id, branchIds)).all();
      if (targetBranches.length !== branchIds.length) {
        throw new Error("Bazı şubeler bulunamadı.");
      }
      for (const branch of targetBranches) {
        if (branch.orgId !== org.id) {
          throw new Error("Güvenlik İhlali: Farklı bir organizasyona ait şubeye personel davet edilemez.");
        }
      }
    } else {
      throw new Error("Personelin atanacağı en az bir şube seçilmelidir.");
    }
    
    const client = await clerkClient();
    const envEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
    if (envEmails.includes(email.toLowerCase().trim())) {
      throw new Error("Bu e-posta adresi sisteme davet edilemez.");
    }
    
    // 2. Clerk Org Invitation
    await client.organizations.createOrganizationInvitation({
      organizationId: org.id,
      emailAddress: email,
      inviterUserId: userId,
      role: "org:member",
      publicMetadata: {
        role: role,
        targetBranchIds: branchIds
      },
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
    });
    
    return { success: true };
  } catch (error: unknown) {
    const err = error as { errors?: { message: string }[]; message?: string };
    const message = err.errors?.[0]?.message || err.message || "Bilinmeyen hata";
    console.error("[InviteStaffAction Error]:", message, error);
    throw new Error(message);
  }
}

