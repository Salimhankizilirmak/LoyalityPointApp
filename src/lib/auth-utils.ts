import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { organizations, users, staffProfiles, customerProfiles, branches, invitations, customers } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

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

  let dbRole: "SUPER_ADMIN" | "BOSS" | "MANAGER" | "CASHIER" | "CUSTOMER" = "CUSTOMER";
  if (isSuperByEmail || isSuperByRole) {
    dbRole = "SUPER_ADMIN";
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
  await db.insert(users).values({
    clerkId: userId,
    email,
    role: dbRole,
  })
  .onConflictDoUpdate({
    target: users.clerkId,
    set: {
      email,
      role: dbRole,
    }
  });

  const dbUser = (await db.select().from(users).where(eq(users.clerkId, userId)).get())!;
  console.log(`[AuthUtils] Synchronized local user: ${dbUser.id} with role ${dbUser.role}`);

  // 👑 2. Süper Admin Yönlendirmesi
  if (dbUser.role === "SUPER_ADMIN") {
    console.log("[AuthUtils] 👑 Global Super Admin detected, redirecting to /admin");
    return "/admin";
  }

  // 🏢 3. Boss / Şirket Sahibi Kontrolü
  if (dbUser.role === "BOSS") {
    // 1. Öncelikle yerel veritabanında bu BOSS'a bağlı bir organizasyon var mı bak
    let dbOrg = await db.select().from(organizations).where(eq(organizations.bossId, dbUser.id)).get();
    
    // 2. Eğer yerel veritabanında yoksa ama Clerk session'da orgId varsa, veritabanına senkronize et
    if (!dbOrg && orgId) {
      const clerkOrg = await client.organizations.getOrganization({ organizationId: orgId });
      const insertedOrgs = await db.insert(organizations).values({
        id: orgId,
        name: clerkOrg.name,
        bossId: dbUser.id,
        bossEmail: email,
        branchLimit: 2,
        isActive: true,
        status: "ACTIVE",
      })
      .onConflictDoUpdate({
        target: organizations.id,
        set: {
          name: clerkOrg.name,
          bossId: dbUser.id,
          bossEmail: email,
          status: "ACTIVE",
        }
      })
      .returning();
      dbOrg = insertedOrgs[0];
      console.log(`[AuthUtils] Synchronized new boss organization: ${dbOrg.name}`);
    }

    // 3. Eğer yerel veritabanında organizasyon varsa, aktifliğini kontrol et ve dashboard'a yönlendir
    if (dbOrg) {
      if (!dbOrg.isActive) {
        return "/org-disabled";
      }
      return "/boss-dashboard";
    }

    // 4. Hicbir yerde organizasyon bulunamadıysa ama BOSS rolünde ise, yerel DB'de askıda bekleyen organizasyonu bağla (Self-healing fallback)
    if (email) {
      const pendingOrg = await db.select()
        .from(organizations)
        .where(and(
          eq(organizations.bossEmail, email),
          eq(organizations.status, "PENDING"),
          isNull(organizations.bossId)   // Sadece gerçekten bağlanmamış org'ı yakala
        ))
        .get();
      
      if (pendingOrg) {
        await db.update(organizations)
          .set({
            bossId: dbUser.id,
            bossEmail: email,            // Audit trail: bossEmail'i koru
            status: "ACTIVE",
          })
          .where(eq(organizations.id, pendingOrg.id));
        
        // Yerel invitations tablosundaki durumu ACCEPTED yapalım:
        await db.update(invitations)
          .set({ status: "ACCEPTED" })
          .where(and(
            eq(invitations.email, email),
            eq(invitations.organizationId, pendingOrg.id),
            eq(invitations.status, "PENDING")
          ));
        
        // Clerk tarafında da senkronizasyon yapmayı dene
        try {
          await client.users.updateUserMetadata(userId, {
            publicMetadata: {
              role: "boss",
              orgId: pendingOrg.id,
            }
          });
          
          await client.organizations.createOrganizationMembership({
            organizationId: pendingOrg.id,
            userId: userId,
            role: "org:admin",
          });
        } catch (clerkErr) {
          console.warn(`[AuthUtils] Clerk metadata/membership sync skipped:`, clerkErr);
        }

        console.log(`[AuthUtils] Self-healing sync linked BOSS ${dbUser.id} to organization ${pendingOrg.id} via email match`);
        return "/boss-dashboard";
      }
    }

    // Organizasyon bulunamadı
    console.warn(`[AuthUtils] BOSS user ${dbUser.id} has no linked organization!`);
    return "/org-disabled";
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
      const branchExists = await db.select()
        .from(branches)
        .where(eq(branches.id, branchId))
        .get();

      if (!branchExists) {
        console.warn(`[JIT Staff Sync] ⚠️ Stale branchId (${branchId}) detected in Clerk metadata. Redirecting to auth-callback for self-healing.`);
        return "/auth-callback";
      }

      await db.insert(staffProfiles).values({
        userId: dbUser.id,
        branchId,
      }).onConflictDoNothing();
    }

    const staffProfile = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, dbUser.id)).get();
    if (!staffProfile) {
      console.warn(`[AuthUtils] Staff member ${userId} has no branch profile.`);
      return "/sign-in";
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
    // shadow davetiye tablosundan e-posta üzerinden bekleyen müşteri davetiyesini sorgula
    const pendingInvite = await db.select()
      .from(invitations)
      .where(and(
        eq(invitations.email, email),
        eq(invitations.role, "CUSTOMER"),
        eq(invitations.status, "PENDING")
      ))
      .get();

    const targetOrgId = orgId || (meta.org_id as string) || pendingInvite?.organizationId || "";

    if (targetOrgId) {
      await db.transaction(async (tx) => {
        // 1. customerProfiles tablosuna shadow veya normal kaydını ekle
        await tx.insert(customerProfiles).values({
          userId: dbUser.id,
          orgId: targetOrgId,
          currentPoints: 0,
        }).onConflictDoNothing();

        // 2. Eğer davet kaydı varsa, customers tablosuna telefon numarası ve isim ile asıl kaydı oluştur
        if (pendingInvite && pendingInvite.phoneNumber) {
          const userFullname = user.firstName || user.lastName 
            ? `${user.firstName || ""} ${user.lastName || ""}`.trim() 
            : (dbUser.name || email);

          // Aynı org'da mükerrer telefon numarası kontrolü
          const existingCustomer = await tx.select()
            .from(customers)
            .where(and(
              eq(customers.organizationId, targetOrgId),
              eq(customers.phoneNumber, pendingInvite.phoneNumber)
            ))
            .get();

          if (!existingCustomer) {
            await tx.insert(customers).values({
              organizationId: targetOrgId,
              phoneNumber: pendingInvite.phoneNumber,
              name: userFullname,
              totalPoints: 0,
            });
          }

          // 3. Shadow davetiyeyi ACCEPTED yap
          await tx.update(invitations)
            .set({ status: "ACCEPTED" })
            .where(eq(invitations.id, pendingInvite.id));

          console.log(`[AuthUtils] Self-healing linked CUSTOMER ${dbUser.id} with phone ${pendingInvite.phoneNumber} to org ${targetOrgId}`);
        }
      });
    }

    return "/customer-dashboard";
  }

  console.log(`[AuthUtils] Access Denied for ${email}. Role: ${dbUser.role}`);
  return "/sign-in";
}
