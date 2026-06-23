import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, organizations, invitations, staffProfiles } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { normalizePhoneToUsername } from "@/lib/utils";

export async function GET() {
  console.log("[StatusAPI] 🔍 Check sync status requested.");

  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      console.warn("[StatusAPI] 🛑 No clerk session found.");
      return NextResponse.json({ synced: false, error: "Oturum bulunamadı." }, { status: 401 });
    }

    const client = await clerkClient();

    // 1. Yerel veritabanında kullanıcıyı sorgula
    let dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();

    // 🔄 SELF-HEALING FALLBACK: Eğer kullanıcı local DB'de yoksa veya BOSS ise organizasyon eşleşmesi eksikse
    // Clerk üzerinden güncel bilgileri çekip veritabanını senkronize et.
    if (!dbUser) {
      console.log(`[StatusAPI] 🔄 Self-healing user sync initiated for clerkId: ${userId}`);
      
      const user = await client.users.getUser(userId);
      const email = user.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";
      const metadata = (user.publicMetadata || {}) as Record<string, unknown>;
      let role = (metadata.role as string) || "";
      // Akıllı BOSS tespiti: Eğer e-postaya ait askıda bekleyen bir organizasyon varsa rolü BOSS olarak ata
      if (role !== "boss" && email) {
        const pendingOrgCheck = await db.select()
          .from(organizations)
          .where(and(
            eq(organizations.bossEmail, email),
            eq(organizations.status, "PENDING")
          ))
          .get();
        if (pendingOrgCheck) {
          role = "boss";
        }
      }

      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || null;
      const localRole = (role.toUpperCase() === "BOSS" || !role ? "BOSS" : role.toUpperCase()) as "SUPER_ADMIN" | "BOSS" | "MANAGER" | "CASHIER" | "CUSTOMER";

      const inviteForUser = await db.select()
        .from(invitations)
        .where(eq(invitations.email, email.toLowerCase()))
        .get();

      const usernameFromPhone = inviteForUser?.phoneNumber
        ? normalizePhoneToUsername(inviteForUser.phoneNumber)
        : null;

      await db.insert(users).values({
        clerkId: userId,
        email: email,
        role: localRole,
        name: name,
        username: usernameFromPhone,
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email: email,
          role: localRole,
          name: name,
          username: sql`COALESCE(${users.username}, ${usernameFromPhone})`,
        }
      });
      
      dbUser = (await db.select().from(users).where(eq(users.clerkId, userId)).get())!;
      console.log(`[StatusAPI] 👤 Self-healing: Created/Updated local user record. Id=${dbUser.id}, Role=${dbUser.role}`);
    }

    // 1.5. Çalışan Kontrolü (Employee Check) & Self-Healing
    const user = await client.users.getUser(userId);
    const publicMetadata = (user.publicMetadata || {}) as Record<string, unknown>;

    if (orgId && !publicMetadata.role) {
      console.log(`[StatusAPI] 🛠️ Employee check triggered for user: ${userId}`);
      const email = user.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";

      if (!email) {
        console.warn("[StatusAPI] 🛑 User email not found on Clerk user object.");
        return NextResponse.json({ synced: false, error: "E-posta bulunamadı." }, { status: 400 });
      }

      // Turso 'invitations' tablosundan kullanıcının e-postasına göre kaydını bul.
      const invite = await db.select()
        .from(invitations)
        .where(eq(invitations.email, email))
        .get();

      // B2B mimarisinde davetiye bulunmalıdır ve branchId zorunludur.
      if (!invite || !invite.branchId) {
        console.warn(`[StatusAPI] 🛑 B2B Security Gate: Employee invitation or branchId missing for ${email}`);
        return NextResponse.json({ synced: false, error: "Geçerli bir şube davetiyesi bulunamadı." }, { status: 400 });
      }

      console.log(`[StatusAPI] 🎟️ Found invitation for ${email}: Role=${invite.role}, BranchId=${invite.branchId}`);

      // Eğer veritabanında davet hala PENDING görünüyorsa, bunu 'ACCEPTED' olarak güncelle
      if (invite.status === "PENDING") {
        await db.update(invitations)
          .set({ status: "ACCEPTED" })
          .where(eq(invitations.id, invite.id));
        console.log(`[StatusAPI] 🎟️ Invitation status updated to ACCEPTED.`);
      }

      // 'staffProfiles' tablosuna kaydını (yoksa) oluştur (Self-Healing)
      const existingStaffProfile = await db.select()
        .from(staffProfiles)
        .where(eq(staffProfiles.userId, dbUser.id))
        .get();

      if (!existingStaffProfile) {
        await db.insert(staffProfiles).values({
          userId: dbUser.id,
          branchId: invite.branchId,
          isActive: true,
        });
        console.log(`[StatusAPI] 👤 Staff profile created for userId=${dbUser.id} and branchId=${invite.branchId}`);
      }

      // 'users' tablosundaki yerel rolü güncelle
      const localRole = invite.role as "SUPER_ADMIN" | "BOSS" | "MANAGER" | "CASHIER" | "CUSTOMER";
      if (dbUser.role !== localRole) {
        await db.update(users)
          .set({ role: localRole })
          .where(eq(users.id, dbUser.id));
        console.log(`[StatusAPI] 👤 Local user role updated to ${localRole}`);
        dbUser.role = localRole;
      }

      // Clerk Backend SDK kullanarak kullanıcının 'publicMetadata'sına bulduğun { role, branchId } bilgilerini STRICTLY yaz.
      const clerkRole = invite.role.toLowerCase();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          role: clerkRole,
          branchId: invite.branchId,
          orgId: orgId,
        }
      });
      console.log(`[StatusAPI] 👑 Clerk publicMetadata updated: role=${clerkRole}, branchId=${invite.branchId}, orgId=${orgId}`);

      return NextResponse.json({ synced: true });
    }

    // 2. Eğer rol BOSS ise, askıdaki organizasyonun bağlanıp bağlanmadığını doğrula
    if (dbUser.role === "BOSS") {
      let dbOrg = await db.select().from(organizations).where(eq(organizations.bossId, dbUser.id)).get();

      if (!dbOrg) {
        console.log(`[StatusAPI] 🔄 Self-healing organization sync initiated for BOSS user: ${dbUser.id}`);
        
        const user = await client.users.getUser(userId);
        const email = user.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";
        const metadata = (user.publicMetadata || {}) as Record<string, unknown>;
        const orgId = (metadata.orgId as string) || "";

        let pendingOrg = null;
        if (orgId) {
          pendingOrg = await db.select().from(organizations).where(eq(organizations.id, orgId)).get();
        }
        if (!pendingOrg && email) {
          pendingOrg = await db.select()
            .from(organizations)
            .where(and(
              eq(organizations.bossEmail, email),
              eq(organizations.status, "PENDING"),
              isNull(organizations.bossId)   // Sadece gerçekten bağlanmamış org'ı yakala
            ))
            .get();
        }

        if (pendingOrg) {
          console.log(`[StatusAPI] 🏢 Self-healing: Pending organization found: ${pendingOrg.name} (${pendingOrg.id})`);
          
          await db.update(organizations)
            .set({
              bossId: dbUser.id,
              status: "ACTIVE",
            })
            .where(eq(organizations.id, pendingOrg.id));
          
          dbOrg = pendingOrg;
        } else if (orgId) {
          // JIT Fallback Recovery: DB sıfırlanmış ama Clerk session token hala canlıysa organizasyonu yeniden yarat
          console.log(`[StatusAPI] 🛠️ DB cleared but Clerk session alive. Re-creating organization dynamically for orgId: ${orgId}`);
          try {
            const clerkOrg = await client.organizations.getOrganization({ organizationId: orgId });
            const insertedOrgs = await db.insert(organizations).values({
              id: orgId,
              name: clerkOrg.name,
              bossId: dbUser.id,
              bossEmail: email,
              branchLimit: 3,
              isActive: true,
              status: "ACTIVE",
            })
            .onConflictDoUpdate({
              target: organizations.id,
              set: { bossId: dbUser.id, bossEmail: email, status: "ACTIVE" }
            })
            .returning();
            
            dbOrg = insertedOrgs[0];
          } catch (clerkFetchErr) {
            console.error(`[StatusAPI] ❌ Failed to dynamically recreate organization via Clerk API:`, clerkFetchErr);
          }
        }

        if (!dbOrg) {
          console.warn(`[StatusAPI] 🛑 Hard recovery failed. No matching organization found on DB or Clerk for BOSS: ${email}`);
          return NextResponse.json({ synced: false, error: "Şirket kaydınız bulunamadı. Lütfen sistem yöneticinizle iletişime geçin." }, { status: 404 });
        }
          
        console.log(`[StatusAPI] ⛓️ Self-healing: Linked BOSS ${dbUser.id} to organization ${dbOrg.id}`);
        
        // Clerk tarafında da publicMetadata'yı güncelle ve üyelik oluştur
        try {
          await client.users.updateUserMetadata(userId, {
            publicMetadata: {
              role: "boss",
              orgId: dbOrg.id,
            }
          });
          
          await client.organizations.createOrganizationMembership({
            organizationId: dbOrg.id,
            userId: userId,
            role: "org:admin",
          });
          console.log(`[StatusAPI] 👑 Self-healing: Created Clerk membership & publicMetadata updated.`);
        } catch (clerkErr) {
          console.warn(`[StatusAPI] ⚠️ Self-healing Clerk updates skipped or partially failed:`, clerkErr);
        }
      }

      console.log(`[StatusAPI] 🏢 Linked organization found: Name=${dbOrg.name}, Id=${dbOrg.id}`);
    }

    // Kullanıcı mevcut ve BOSS ise organizasyonu da bağlanmış -> Senkronizasyon Tamamlandı!
    console.log("[StatusAPI] ✅ Synchronization verified successfully!");
    return NextResponse.json({ synced: true });

  } catch (error) {
    console.error("[StatusAPI] ❌ Failed to check sync status:", error);
    return NextResponse.json({ synced: false, error: "Sunucu hatası" }, { status: 500 });
  }
}
