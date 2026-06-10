import { auth, createClerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, organizations, invitations, branches } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";


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
        await tx.insert(users).values({
          clerkId: userId,
          email: userEmail,
          role: resolvedRole,
          name: name || null,
        })
        .onConflictDoUpdate({
          target: users.clerkId,
          set: {
            email: userEmail,
            role: resolvedRole,
            name: name || null,
          }
        });

        dbUser = (await tx.select().from(users).where(eq(users.clerkId, userId)).get())!;
        console.log(`[LayoutGuard] 👤 Instantly created/updated local user: ${dbUser.id} with role ${dbUser.role}`);

        if (resolvedRole === "BOSS") {
          // Davetiye durumunu ACCEPTED olarak güncelle (State Drift Çözümü)
          await tx.update(invitations)
            .set({ status: "ACCEPTED" })
            .where(and(
              eq(invitations.email, userEmail),
              eq(invitations.status, "PENDING")
            ));
          console.log(`[LayoutGuard] 📩 Updated invitation status to ACCEPTED for BOSS email: ${userEmail}`);

          let orgLinked = false;

          // Önce Clerk org üyelikleri üzerinden dene (webhook geldiyse)
          for (const org of clerkOrgs) {
            const pendingOrg = await tx.select()
              .from(organizations)
              .where(eq(organizations.id, org.orgId))
              .get();

            if (pendingOrg && (!pendingOrg.bossId || pendingOrg.bossId === "null" || pendingOrg.bossId === "" || pendingOrg.status === "PENDING")) {
              await tx.update(organizations)
                .set({ bossId: dbUser.id, bossEmail: userEmail, status: "ACTIVE" })
                .where(eq(organizations.id, org.orgId));
              console.log(`[LayoutGuard] ⛓️ Linked BOSS ${dbUser.id} to organization ${org.orgId} via Clerk membership.`);
              orgLinked = true;
              break;
            }
          }

          // Clerk orgs boşsa veya eşleşme yoksa email bazlı fallback (webhook gecikmesi senaryosu)
          if (!orgLinked && userEmail) {
            const pendingOrgByEmail = await tx.select()
              .from(organizations)
              .where(and(
                eq(organizations.bossEmail, userEmail),
                eq(organizations.status, "PENDING"),
                isNull(organizations.bossId),
              ))
              .get();

            if (pendingOrgByEmail) {
              await tx.update(organizations)
                .set({ bossId: dbUser.id, bossEmail: userEmail, status: "ACTIVE" })
                .where(eq(organizations.id, pendingOrgByEmail.id));
              console.log(`[LayoutGuard] ⛓️ Linked BOSS ${dbUser.id} to organization ${pendingOrgByEmail.id} via email fallback.`);

              // Clerk metadata + üyelik senkronizasyonu (non-blocking)
              try {
                await client.users.updateUserMetadata(userId, {
                  publicMetadata: { role: "boss", orgId: pendingOrgByEmail.id },
                });
                await client.organizations.createOrganizationMembership({
                  organizationId: pendingOrgByEmail.id,
                  userId,
                  role: "org:admin",
                });
              } catch (clerkSyncErr) {
                console.warn(`[LayoutGuard] ⚠️ Clerk org membership sync skipped (non-critical):`, clerkSyncErr);
              }
            } else {
              console.warn(`[LayoutGuard] ⚠️ BOSS ${dbUser.id}: Clerk orgs boş ve email bazlı PENDING org da bulunamadı.`);
            }
          }
        }

        if (resolvedRole === "MANAGER" || resolvedRole === "CASHIER") {
          // 1. invitations tablosundan bu kullanıcının e-postasına ait shadow davetiyeyi çek
          const shadowInvite = await tx.select()
            .from(invitations)
            .where(and(
              eq(invitations.email, userEmail),
              eq(invitations.status, "PENDING")
            ))
            .get();

          let invitedBranchId: string | null = shadowInvite?.branchId || null;

          // Eğer veritabanında shadow davetiye bulunamadıysa, Clerk user metadata alanından oku
          if (!invitedBranchId) {
            invitedBranchId = (clerkUser.publicMetadata?.branch_id as string) || 
                              (clerkUser.publicMetadata?.branchId as string) || 
                              null;
          }

          if (invitedBranchId) {
            const { staffProfiles } = await import("@/db/schema");
            
            // 2. staff_profiles tablosuna profil kaydı ekle (yoksa)
            const existingProfile = await tx.select()
              .from(staffProfiles)
              .where(eq(staffProfiles.userId, dbUser.id))
              .get();

            if (!existingProfile) {
              const branchCheck = await tx.select()
                .from(branches)
                .where(eq(branches.id, invitedBranchId))
                .get();

              if (!branchCheck) {
                console.warn(`[LayoutGuard] ⚠️ Stale branch ${invitedBranchId} check failed. Bypassing staff insertion to prevent constraint crash.`);
                return;
              }

              await tx.insert(staffProfiles).values({
                userId: dbUser.id,
                branchId: invitedBranchId,
              });
              console.log(`[LayoutGuard] 👤 Instantly created staff profile for ${resolvedRole} (${dbUser.id}) on branch ${invitedBranchId}`);
            }

            // 2.5 user_branches tablosuna junction kaydı ekle (yoksa)
            const { userBranches } = await import("@/db/schema");
            const existingJunction = await tx.select()
              .from(userBranches)
              .where(and(
                eq(userBranches.userId, dbUser.id),
                eq(userBranches.branchId, invitedBranchId)
              ))
              .get();

            if (!existingJunction) {
              await tx.insert(userBranches).values({
                userId: dbUser.id,
                branchId: invitedBranchId,
              });
              console.log(`[LayoutGuard] 🔗 Instantly created userBranch junction for ${dbUser.id} on branch ${invitedBranchId}`);
            }

            // 3. EĞER MANAGER ise şubenin managerId alanını güncelle
            if (resolvedRole === "MANAGER") {
              const { branches } = await import("@/db/schema");
              await tx.update(branches)
                .set({ managerId: dbUser.id })
                .where(eq(branches.id, invitedBranchId));
              console.log(`[LayoutGuard] 💼 Instantly updated branch manager to ${dbUser.id} for branch ${invitedBranchId}`);
            }

            // 4. Davetiye durumunu ACCEPTED yap (eğer shadow davetiye varsa)
            if (shadowInvite) {
              await tx.update(invitations)
                .set({ status: "ACCEPTED" })
                .where(eq(invitations.id, shadowInvite.id));
              console.log(`[LayoutGuard] 📩 Updated staff invitation ${shadowInvite.id} status to ACCEPTED`);
            }
          } else {
            console.error(`[LayoutGuard] ❌ Staff user ${dbUser.id} has no branch assignment in DB invitations nor Clerk metadata!`);
          }
        }
      });
    } catch (syncErr) {
      console.error("[LayoutGuard] ❌ Instantly auto-sync failed:", syncErr);
    }

    // dbUser hâlâ null ise (transaction exception) → /auth-callback'e yönlendir, / değil
    if (!dbUser) {
      console.warn(`[LayoutGuard] 🔄 dbUser sync tamamlanamadı. /auth-callback'e yönlendiriliyor.`);
      redirect("/auth-callback");
    }
  }

  // 📩 3. Davetiye ve Askıda Bekleyen Organizasyon Eşleşmelerini Çek
  let dbOrgPending: Array<{ id: string; name: string; bossEmail: string | null }> = [];
  const clerkInvitations: Array<{ orgId: string; orgName: string; invId: string; status: string; role: string }> = [];

  if (userEmail) {
    try {
      const pendingOrgs = await db.select()
        .from(organizations)
        .where(and(
          eq(organizations.bossEmail, userEmail),
          eq(organizations.status, "PENDING")
        ))
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

  if (dbUser && dbUser.role) {
    // 🛡️ Askıya Alınmış Personel Kontrolü ve Cookie Auto-Injection
    if (dbUser.role === "CASHIER" || dbUser.role === "MANAGER") {
      const { staffProfiles } = await import("@/db/schema");
      const profile = await db.select()
        .from(staffProfiles)
        .where(eq(staffProfiles.userId, dbUser.id))
        .get();

      if (profile) {
        if (!profile.isActive) {
          console.warn(`[LayoutGuard] 🛑 Askıya alınmış personel engellendi. UserId: ${dbUser.id}`);
          redirect("/org-disabled?reason=suspended");
        }

        // active_branch_id çerez enjeksiyonu artık proxy.ts (Middleware) katmanında yapılmaktadır.
        // Bu sayede Server Component render edilirken çerez yazma kısıtlaması (Next.js kısıtlaması) aşılmış olur.
      }
    }

    // 🏢 BOSS için ek organizasyon bağlantı kontrolü — deadlock zırhı
    if (dbUser.role === "BOSS") {



      const linkedOrg = await db
        .select()
        .from(organizations)
        .where(eq(organizations.bossId, dbUser.id))
        .get();

      if (!linkedOrg) {
        console.warn(`[LayoutGuard] ⚠️ BOSS ${dbUser.id} (${userEmail}) organizasyona bağlı değil. Self-healing deneniyor...`);

        // Email bazlı self-healing: PENDING + bossId IS NULL organizasyonu bul ve bağla
        let healed = false;
        if (userEmail) {
          try {
            const pendingOrg = await db
              .select()
              .from(organizations)
              .where(and(
                eq(organizations.bossEmail, userEmail),
                eq(organizations.status, "PENDING"),
                isNull(organizations.bossId),
              ))
              .get();

            if (pendingOrg) {
              await db
                .update(organizations)
                .set({ bossId: dbUser.id, bossEmail: userEmail, status: "ACTIVE" })
                .where(eq(organizations.id, pendingOrg.id));

              // Clerk metadata + üyelik senkronizasyonu
              try {
                await client.users.updateUserMetadata(userId, {
                  publicMetadata: { role: "boss", orgId: pendingOrg.id },
                });
                await client.organizations.createOrganizationMembership({
                  organizationId: pendingOrg.id,
                  userId,
                  role: "org:admin",
                });
              } catch (clerkErr) {
                console.warn(`[LayoutGuard] ⚠️ Clerk sync kısmen başarısız (kritik değil):`, clerkErr);
              }

              console.log(`[LayoutGuard] ✅ Self-healing: BOSS ${dbUser.id} → org ${pendingOrg.id} bağlandı.`);
              healed = true;
            }
          } catch (healErr) {
            console.error(`[LayoutGuard] ❌ Self-healing sırasında hata:`, healErr);
          }
        }

        if (!healed) {
          // Org bulunamadı veya self-healing başarısız → JIT sync odasına gönder
          console.warn(`[LayoutGuard] 🔄 Self-healing başarısız. BOSS /auth-callback'e yönlendiriliyor.`);
          redirect("/auth-callback");
        }
      }
    }

    return dbUser;
  }

  // Yetkilendirme başarısızsa doğrudan ana sayfaya yönlendir
  console.log(`[LayoutGuard] 🛑 Yetkisiz Giriş: Kullanıcı ana sayfaya yönlendiriliyor. UserId: ${userId}`);
  redirect("/");
}
