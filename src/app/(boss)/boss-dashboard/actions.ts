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
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const proto = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const appUrl = `${proto}://${host}`;

    await client.organizations.createOrganizationInvitation({
      organizationId: org.id,
      emailAddress: email,
      inviterUserId: userId,
      role: "org:member",
      publicMetadata: {
        role: role,
        targetBranchIds: branchIds
      },
      redirectUrl: `${appUrl}/dashboard`,
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

export async function saveUsernameAction(prevState: unknown, formData: FormData) {
  const { auth, clerkClient } = await import("@clerk/nextjs/server");
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Yetkisiz işlem. Oturum bulunamadı." };
  }

  const usernameInput = formData.get("username") as string;
  if (!usernameInput || usernameInput.trim() === "") {
    return { success: false, error: "Kullanıcı adı boş bırakılamaz." };
  }

  const username = usernameInput.trim().toLowerCase();

  // Regex doğrulama: Sadece küçük harf, rakam, alt çizgi ve nokta. En az 3, en fazla 30 karakter.
  const usernameRegex = /^[a-z0-9_.]+$/;
  if (!usernameRegex.test(username)) {
    return { success: false, error: "Kullanıcı adı sadece küçük harf, rakam, alt çizgi (_) ve nokta (.) içerebilir." };
  }

  if (username.length < 3 || username.length > 30) {
    return { success: false, error: "Kullanıcı adı 3 ile 30 karakter arasında olmalıdır." };
  }

  try {
    const client = await clerkClient();

    // 1. Clerk üzerinde kullanıcıyı güncelle (Primary Source)
    try {
      await client.users.updateUser(userId, {
        username: username,
      });
      console.log(`[SetupUsername] 🏆 Clerk username updated successfully for ${userId}`);
    } catch (clerkErr) {
      console.error(`[SetupUsername] ❌ Clerk username update failed:`, clerkErr);
      
      const clerkErrObj = clerkErr as { status?: number; errors?: Array<{ code?: string; message?: string }> };
      const errCode = clerkErrObj.errors?.[0]?.code || "";
      const errMsg = clerkErrObj.errors?.[0]?.message || "";
      
      if (errCode === "form_identifier_exists" || errMsg.includes("exists") || errMsg.includes("taken") || clerkErrObj.status === 422) {
        return { 
          success: false, 
          error: "Bu kullanıcı adı dünyada başka bir işletme tarafından alınmış. Lütfen farklı bir ad deneyin." 
        };
      }
      
      return { 
        success: false, 
        error: errMsg || "Clerk üzerinde kullanıcı adı güncellenirken hata oluştu." 
      };
    }

    // 2. Turso Veritabanını güncelle
    const { db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    try {
      await db.update(users)
        .set({ username })
        .where(eq(users.clerkId, userId));
      console.log(`[SetupUsername] 🗄️ Turso DB users table updated successfully for clerkId: ${userId}`);
    } catch (dbErr) {
      console.error(`[SetupUsername] ❌ Turso DB update failed:`, dbErr);
      return { success: false, error: "Kullanıcı adı kaydedildi fakat yerel veritabanı senkronizasyonunda hata oluştu." };
    }

    // 3. Cache temizle ve yönlendir
    const { CACHE_TAGS, purgeCacheTag } = await import("@/lib/cache-registry");
    const { revalidatePath } = await import("next/cache");

    purgeCacheTag(CACHE_TAGS.userOwnership(userId));
    revalidatePath("/boss-dashboard");
    revalidatePath("/boss-dashboard", "layout");

    return { success: true, error: "" };
  } catch (err) {
    console.error(`[SetupUsername] ❌ Global setup error:`, err);
    return { success: false, error: "Beklenmedik bir hata oluştu. Lütfen tekrar deneyin." };
  }
}

