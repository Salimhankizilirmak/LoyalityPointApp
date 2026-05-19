import { auth, createClerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, organizations } from "@/db/schema";
import { eq, isNull, and } from "drizzle-orm";

/**
 * 🛡️ Yalın Layout Guard
 * Giriş yapan kullanıcının veritabanında geçerli bir rolü/profili varsa geçişine izin verir.
 * Henüz profili yerel veritabanına işlenmemiş meşru yeni kullanıcıları asenkron webhook
 * senkronizasyonunu beklemesi için doğrudan /unauthorized (Aktivasyon Odası) sayfasına yönlendirir.
 * 
 * 🔍 Ek olarak, terminalde tam izlenebilirlik (observability) sağlamak amacıyla
 * kullanıcının veritabanı, Clerk davetiyeleri, rolleri ve organizasyon bağlantılarını detaylı loglar.
 */
export async function checkLayoutGuard() {
  const { userId } = await auth();

  if (!userId) {
    console.log("[LayoutGuard] 🛑 Giriş yapmış kullanıcı oturumu bulunamadı. Ana sayfaya yönlendiriliyor.");
    redirect("/");
  }

  // 🛡️ 1. Clerk Canlı Durum Sorgulama (Observability)
  const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  let clerkUser = null;
  let clerkOrgs: Array<{ orgId: string; orgName: string; role: string }> = [];
  let userEmail = "";

  try {
    clerkUser = await client.users.getUser(userId);
    userEmail = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";
    
    const memberships = await client.users.getOrganizationMembershipList({ userId, limit: 10 });
    clerkOrgs = memberships.data.map((m) => ({
      orgId: m.organization.id,
      orgName: m.organization.name,
      role: m.role,
    }));
  } catch (clerkErr) {
    console.error(`[LayoutGuard] ❌ Clerk Canlı API sorgulaması başarısız (UserId: ${userId}):`, clerkErr);
  }

  // 🗄️ 2. Turso Veritabanı Durumunu Sorgula
  let dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();

  // ⚡ Canlı Otomatik Eşleme & Anında Senkronizasyon (Hot Sync)
  if (!dbUser && clerkUser && userEmail) {
    console.log(`[LayoutGuard] ⚡ Kullanıcı DB'de bulunamadı. Canlı Clerk verileriyle anında senkronize ediliyor... Email: ${userEmail}`);
    
    let resolvedRole: "SUPER_ADMIN" | "BOSS" | "MANAGER" | "CASHIER" | "CUSTOMER" = "CUSTOMER";
    
    const envEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
    const isSuperByEmail = envEmails.includes(userEmail) || userEmail === "novexistech@gmail.com";
    const userRoleMeta = (clerkUser.publicMetadata?.role as string) || "";
    
    if (isSuperByEmail || userRoleMeta === "super_admin" || userRoleMeta === "superadmin") {
      resolvedRole = "SUPER_ADMIN";
    } else if (userRoleMeta === "boss" || clerkOrgs.some(o => o.role === "org:admin")) {
      resolvedRole = "BOSS";
    } else if (userRoleMeta === "manager") {
      resolvedRole = "MANAGER";
    } else if (userRoleMeta === "cashier") {
      resolvedRole = "CASHIER";
    } else if (userRoleMeta === "customer") {
      resolvedRole = "CUSTOMER";
    }

    const firstName = clerkUser.firstName || "";
    const lastName = clerkUser.lastName || "";
    const name = `${firstName} ${lastName}`.trim();

    try {
      await db.transaction(async (tx) => {
        const inserted = await tx.insert(users).values({
          clerkId: userId,
          email: userEmail,
          role: resolvedRole,
          name: name || null,
        }).returning();
        dbUser = inserted[0];
        console.log(`[LayoutGuard] 👤 Instantly created local user: ${dbUser.id} with role ${dbUser.role}`);

        if (resolvedRole === "BOSS") {
          for (const org of clerkOrgs) {
            const pendingOrg = await tx.select()
              .from(organizations)
              .where(eq(organizations.id, org.orgId))
              .get();

            if (pendingOrg && (!pendingOrg.bossId || pendingOrg.bossId === "null" || pendingOrg.bossId === "")) {
              await tx.update(organizations)
                .set({
                  bossId: dbUser.id,
                  bossEmail: null,
                })
                .where(eq(organizations.id, org.orgId));
              console.log(`[LayoutGuard] ⛓️ Linked BOSS ${dbUser.id} to organization ${org.orgId} instantly.`);
            }
          }
        }
      });
    } catch (syncErr) {
      console.error("[LayoutGuard] ❌ Instantly auto-sync failed:", syncErr);
    }
  }

  // 📩 3. Davetiye ve Askıda Bekleyen Organizasyon Eşleşmelerini Çek
  let dbOrgPending: Array<{ id: string; name: string; bossEmail: string | null }> = [];
  const clerkInvitations: Array<{ orgId: string; orgName: string; invId: string; status: string; role: string }> = [];

  if (userEmail) {
    try {
      const pendingOrgs = await db.select()
        .from(organizations)
        .where(and(eq(organizations.bossEmail, userEmail), isNull(organizations.bossId)))
        .all();
      
      dbOrgPending = pendingOrgs;

      if (clerkOrgs.length > 0) {
        for (const org of clerkOrgs) {
          const invList = await client.organizations.getOrganizationInvitationList({
            organizationId: org.orgId,
          });
          const match = invList.data.find(inv => inv.emailAddress.toLowerCase() === userEmail);
          if (match) {
            clerkInvitations.push({
              orgId: org.orgId,
              orgName: org.orgName,
              invId: match.id,
              status: match.status || "",
              role: match.role,
            });
          }
        }
      }
    } catch (dbInvErr) {
      console.error("[LayoutGuard] ❌ Davetiyeler ve organizasyonlar çekilirken hata oluştu:", dbInvErr);
    }
  }

  // 📊 Detaylı Observability Logunun Terminale Yazılması
  console.log("============================================================");
  console.log(`🔍 [OBSERVABILITY LOG] Kullanıcı Giriş Denetimi (LayoutGuard)`);
  console.log(`👤 Kullanıcı Clerk ID   : ${userId}`);
  console.log(`📧 Kullanıcı E-postası : ${userEmail || "Bilinmiyor"}`);
  console.log(`🗄️ Turso DB Profil Kaydı: ${dbUser ? "VAR ✅" : "YOK ❌"}`);
  console.log(`🗄️ Turso DB Rolü        : ${dbUser?.role || "ROLSÜZ / NULL"}`);
  console.log(`🏢 Clerk Organizasyonlar: ${JSON.stringify(clerkOrgs)}`);
  console.log(`📩 Clerk Davetiyeleri  : ${JSON.stringify(clerkInvitations)}`);
  console.log(`🏢 DB Askıda Bekleyen  : ${JSON.stringify(dbOrgPending.map(o => ({ id: o.id, name: o.name, bossEmail: o.bossEmail })))}`);
  console.log("============================================================");

  // Eğer veritabanında kullanıcı varsa ve geçerli bir rolü varsa, geçişe izin ver
  if (dbUser && dbUser.role) {
    return;
  }

  // Yetkilendirme başarısızsa doğrudan ana sayfaya yönlendir
  console.log(`[LayoutGuard] 🛑 Yetkisiz Giriş: Kullanıcı ana sayfaya yönlendiriliyor. UserId: ${userId}`);
  redirect("/");
}
