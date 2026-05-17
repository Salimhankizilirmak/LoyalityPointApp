import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { organizations, users, staffProfiles, customerProfiles, branches } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getDashboardRedirectPath(
  userId: string,
  orgId: string | null | undefined,
  orgRole: string | null | undefined
): Promise<string> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  
  console.log(`[AuthUtils] Determining route for userId: ${userId}, orgId: ${orgId}, orgRole: ${orgRole}`);
  console.log(`[AuthUtils] User email: ${email}`);

  const meta = (user.publicMetadata || {}) as Record<string, unknown>;
  const unsafeMeta = (user.unsafeMetadata || {}) as Record<string, unknown>;
  const role = (meta.role as string) || (unsafeMeta.role as string);

  // 👑 1. Süper Admin Rolü & Email eşleşmesi
  const envEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
  const isSuperByEmail = envEmails.includes(email) || email === "novexistech@gmail.com";
  const isSuperByRole = role === "super_admin" || role === "superadmin";

  let dbRole: "ADMIN" | "BOSS" | "MANAGER" | "CASHIER" | "CUSTOMER" = "CUSTOMER";
  if (isSuperByEmail || isSuperByRole) {
    dbRole = "ADMIN";
  } else if (role === "boss" || orgRole === "org:admin") {
    dbRole = "BOSS";
  } else if (role === "manager") {
    dbRole = "MANAGER";
  } else if (role === "cashier") {
    dbRole = "CASHIER";
  } else if (role === "customer") {
    dbRole = "CUSTOMER";
  }

  // 🔄 Eşzamanlı Yerel Veritabanı Senkronizasyonu (Kvkk ve SaaS geçişi için)
  let dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();
  if (!dbUser) {
    const inserted = await db.insert(users).values({
      clerkId: userId,
      email,
      role: dbRole,
    }).returning();
    dbUser = inserted[0];
    console.log(`[AuthUtils] Created new local user: ${dbUser.id} with role ${dbUser.role}`);
  } else if (dbUser.role !== dbRole || dbUser.email !== email) {
    await db.update(users).set({ role: dbRole, email }).where(eq(users.id, dbUser.id));
    dbUser.role = dbRole;
    console.log(`[AuthUtils] Updated local user: ${dbUser.id} role to ${dbRole}`);
  }

  // 👑 2. Süper Admin Yönlendirmesi
  if (dbUser.role === "ADMIN") {
    console.log("[AuthUtils] 👑 Global Super Admin detected, redirecting to /admin");
    return "/admin";
  }

  // 🏢 3. Boss / Şirket Sahibi Kontrolü
  if (dbUser.role === "BOSS") {
    if (orgId) {
      // Organizasyon kaydını veritabanında oluştur/güncelle
      let dbOrg = await db.select().from(organizations).where(eq(organizations.id, orgId)).get();
      if (!dbOrg) {
        const clerkOrg = await client.organizations.getOrganization({ organizationId: orgId });
        const insertedOrg = await db.insert(organizations).values({
          id: orgId,
          name: clerkOrg.name,
          bossId: dbUser.id,
          branchLimit: 2,
          isActive: true,
        }).returning();
        dbOrg = insertedOrg[0];
        console.log(`[AuthUtils] Synchronized new boss organization: ${dbOrg.name}`);
      }

      if (!dbOrg.isActive) {
        return "/org-disabled";
      }

      return "/boss-dashboard";
    }

    return "/create-organization";
  }

  // 🏢 4. Personel (MANAGER, CASHIER) Kontrolü
  if (dbUser.role === "MANAGER" || dbUser.role === "CASHIER") {
    const branchId = (meta.branch_id as string) || (unsafeMeta.branch_id as string) || "";
    
    if (!branchId && orgId) {
      const firstBranch = await db.select().from(branches).where(eq(branches.orgId, orgId)).get();
      if (firstBranch) {
        await db.insert(staffProfiles).values({
          userId: dbUser.id,
          branchId: firstBranch.id,
        }).onConflictDoNothing();
      }
    } else if (branchId) {
      await db.insert(staffProfiles).values({
        userId: dbUser.id,
        branchId,
      }).onConflictDoNothing();
    }

    const staffProfile = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, dbUser.id)).get();
    if (!staffProfile) {
      console.warn(`[AuthUtils] Staff member ${userId} has no branch profile.`);
      return "/unauthorized";
    }

    const branch = await db.select().from(branches).where(eq(branches.id, staffProfile.branchId)).get();
    if (!branch || !branch.isActive) {
      return "/org-disabled";
    }

    const org = await db.select().from(organizations).where(eq(organizations.id, branch.orgId)).get();
    if (!org || !org.isActive) {
      return "/org-disabled";
    }

    return dbUser.role === "MANAGER" ? "/manager-dashboard" : "/cashier-dashboard";
  }

  // 🏢 5. Müşteri (CUSTOMER) Yönlendirmesi
  if (dbUser.role === "CUSTOMER") {
    const targetOrgId = orgId || (meta.org_id as string) || "";
    if (targetOrgId) {
      await db.insert(customerProfiles).values({
        userId: dbUser.id,
        orgId: targetOrgId,
        currentPoints: 0,
      }).onConflictDoNothing();
    }

    return "/customer-dashboard";
  }

  console.log(`[AuthUtils] Access Denied for ${email}. Role: ${dbUser.role}`);
  return "/unauthorized";
}
