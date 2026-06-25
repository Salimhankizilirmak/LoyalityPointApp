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

export async function inviteEmployee(data: { name: string; email: string; role: "manager" | "cashier"; branch: string; org_id?: string; phone: string }) {
  console.log("⚙️ [Server Action]: inviteEmployee tetiklendi, parametreler:", data);
  try {
    const result = await memberService.inviteEmployee(data);
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/boss-dashboard");
    return result;
  } catch (error: unknown) {
    const err = error as { errors?: { message: string }[]; message?: string };
    let message = err.errors?.[0]?.message || err.message || "Bilinmeyen hata";
    
    if (message === "PHONE_ALREADY_REGISTERED") {
      message = "Bu telefon numarası zaten sistemde kayıtlı.";
    } else if (message === "PHONE_INVITATION_EXISTS") {
      message = "Bu telefon numarasına ait aktif bir davet zaten bulunuyor.";
    }
    
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
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL environment variable is not set");
    }

    const clerkInv = await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        orgId: org.id,
        org_id: org.id,
        role: role,
        targetBranchIds: branchIds
      },
      redirectUrl: `${appUrl}/dashboard`,
      ignoreExisting: true,
    });

    const targetRole = role.toLowerCase() as "manager" | "cashier";
    let branchName = "Şube";
    if (branchIds.length > 0) {
      const firstBranch = await db.select().from(branches).where(eq(branches.id, branchIds[0])).get();
      if (firstBranch) {
        branchName = firstBranch.name;
      }
    }

    const { emailService } = await import("@/lib/services/email-service");
    const { getEmployeeInvitationTemplate } = await import("@/lib/templates/email-templates");
    const html = getEmployeeInvitationTemplate(
      clerkInv.url || "",
      targetRole,
      branchName
    );

    await emailService.sendMail({
      to: email.trim().toLowerCase(),
      subject: `${org.name} Personel Daveti`,
      html,
    }).catch((err) => {
      console.error("[EmailService] Personel davet e-postası gönderim hatası:", err);
    });
    
    return { success: true };
  } catch (error: unknown) {
    const err = error as { errors?: { message: string }[]; message?: string };
    const message = err.errors?.[0]?.message || err.message || "Bilinmeyen hata";
    console.error("[InviteStaffAction Error]:", message, error);
    throw new Error(message);
  }
}

export async function setActiveOrganization(orgId: string) {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  
  const { userId } = await (await import("@clerk/nextjs/server")).auth();
  if (!userId) throw new Error("Oturum bulunamadı.");

  const { db } = await import("@/db");
  const { users } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const { getCachedUserOwnedOrgs } = await import("@/lib/services/base-service");

  const dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();
  if (!dbUser || dbUser.role !== "BOSS") {
    throw new Error("Sadece patronlar organizasyon değiştirebilir.");
  }

  // Önbellekli katmandan sahiplik doğrulaması yapılır
  const ownedOrgs = await getCachedUserOwnedOrgs(dbUser.id)(dbUser.id);
  const isOwner = ownedOrgs.some(org => org.id === orgId);

  if (!isOwner) {
    throw new Error("Organizasyon bulunamadı veya bu organizasyona erişim yetkiniz yok.");
  }

  cookieStore.set("selected_org_id", orgId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return { success: true };
}

export async function getTopCustomersAction() {
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) throw new Error("Oturum bulunamadı");

  const { db } = await import("@/db");
  const { users, organizations, customers } = await import("@/db/schema");
  const { eq, desc } = await import("drizzle-orm");

  const boss = await db.select().from(users).where(eq(users.clerkId, userId)).get();
  if (!boss || boss.role !== "BOSS") {
    throw new Error("Sadece yetkili patronlar bu veriyi görebilir.");
  }

  const org = await db.select().from(organizations).where(eq(organizations.bossId, boss.id)).get();
  if (!org) throw new Error("Organizasyon bulunamadı.");

  const topCustomers = await db.select()
    .from(customers)
    .where(eq(customers.organizationId, org.id))
    .orderBy(desc(customers.totalPoints))
    .limit(3)
    .all();

  const maskPhone = (phone: string) => {
    const trimmed = phone.trim();
    if (trimmed.length < 7) return trimmed;
    return `${trimmed.slice(0, 4)} *** **${trimmed.slice(-2)}`;
  };

  return topCustomers.map((c, index) => {
    const earned = c.totalPoints;
    const level = earned > 15000 ? "Platinum" : earned > 8000 ? "Gold" : "Silver";
    return {
      rank: index + 1,
      name: c.name,
      phone: maskPhone(c.phoneNumber),
      earned,
      spent: 0,
      level
    };
  });
}


