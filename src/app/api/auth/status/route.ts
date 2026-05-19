import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, organizations } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function GET() {
  console.log("[StatusAPI] 🔍 Check sync status requested.");

  try {
    const { userId } = await auth();

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
      const orgId = (metadata.orgId as string) || "";

      // Akıllı BOSS tespiti: Eğer e-postaya ait askıda bekleyen bir organizasyon varsa rolü BOSS olarak ata
      if (role !== "boss" && email) {
        const pendingOrgCheck = await db.select()
          .from(organizations)
          .where(and(eq(organizations.bossEmail, email), isNull(organizations.bossId)))
          .get();
        if (pendingOrgCheck) {
          role = "boss";
        }
      }

      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || null;
      const localRole = (role.toUpperCase() === "BOSS" || !role ? "BOSS" : role.toUpperCase()) as "SUPER_ADMIN" | "BOSS" | "MANAGER" | "CASHIER" | "CUSTOMER";
      const inserted = await db.insert(users).values({
        clerkId: userId,
        email: email,
        role: localRole,
        name: name,
      }).returning();
      
      dbUser = inserted[0];
      console.log(`[StatusAPI] 👤 Self-healing: Created local user record. Id=${dbUser.id}, Role=${dbUser.role}`);
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
            .where(and(eq(organizations.bossEmail, email), isNull(organizations.bossId)))
            .get();
        }

        if (pendingOrg) {
          console.log(`[StatusAPI] 🏢 Self-healing: Pending organization found: ${pendingOrg.name} (${pendingOrg.id})`);
          
          await db.update(organizations)
            .set({
              bossId: dbUser.id,
              bossEmail: null,
            })
            .where(eq(organizations.id, pendingOrg.id));
          
          console.log(`[StatusAPI] ⛓️ Self-healing: Linked BOSS ${dbUser.id} to organization ${pendingOrg.id}`);
          
          // Clerk tarafında da publicMetadata'yı güncelle ve üyelik oluştur
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
            console.log(`[StatusAPI] 👑 Self-healing: Created Clerk membership & publicMetadata updated.`);
          } catch (clerkErr) {
            console.warn(`[StatusAPI] ⚠️ Self-healing Clerk updates skipped or partially failed:`, clerkErr);
          }
          
          dbOrg = pendingOrg;
        } else {
          console.warn(`[StatusAPI] ⚠️ No pending organization found for BOSS user email: ${email}`);
          return NextResponse.json({ synced: false });
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
