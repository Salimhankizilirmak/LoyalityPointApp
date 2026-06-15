import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, organizations, branches, userBranches, invitations } from "@/db/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";

type ClerkPayload = {
  type: string;
  data: {
    id?: string;
    email_addresses?: Array<{ email_address: string }>;
    public_metadata?: Record<string, unknown>;
    public_user_data?: { user_id?: string; identifier?: string; username?: string | null };
    organization?: { id?: string };
    username?: string | null;
  };
};

export async function POST(req: Request) {
  console.log("[ClerkWebhook] 📥 Webhook request received.");

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  let payload: ClerkPayload;

  try {
    const body = await req.text();

    if (WEBHOOK_SECRET) {
      // 🔒 Svix ile İmza Doğrulaması
      const headerPayload = await headers();
      const svix_id = headerPayload.get("svix-id");
      const svix_timestamp = headerPayload.get("svix-timestamp");
      const svix_signature = headerPayload.get("svix-signature");

      if (!svix_id || !svix_timestamp || !svix_signature) {
        console.error("[ClerkWebhook] ❌ Missing svix headers.");
        return new Response("Error occured -- no svix headers", { status: 400 });
      }

      const wh = new Webhook(WEBHOOK_SECRET);
      payload = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as ClerkPayload;
    } else {
      // ⚠️ Geliştirme Ortamı: Doğrulamasız Doğrudan İşleme
      console.warn("[ClerkWebhook] ⚠️ CLERK_WEBHOOK_SECRET is not configured. Processing without verification.");
      payload = JSON.parse(body) as ClerkPayload;
    }
  } catch (err) {
    console.error("[ClerkWebhook] ❌ Verification or parsing failed:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }

  const { type, data } = payload;
  console.log(`[ClerkWebhook] 🎭 Event type: ${type}`);

  if (type === "user.created") {
    const clerkId = data.id || "";
    const email = data.email_addresses?.[0]?.email_address?.toLowerCase() || "";
    let role = (data.public_metadata?.role as string) || "";
    const firstName = ((data as Record<string, unknown>).first_name as string) || "";
    const lastName = ((data as Record<string, unknown>).last_name as string) || "";
    const name = `${firstName} ${lastName}`.trim() || null;
    const username = data.username || null;
    const imageUrl = ((data as Record<string, unknown>).image_url as string) || null;

    console.log(`[ClerkWebhook] 👤 New user created event details: ClerkId=${clerkId}, Email=${email}, Username=${username}, MetadataRole=${role}, Name=${name}, ImageUrl=${imageUrl}`);

    // Global invitation'dan gelen publicMetadata Clerk tarafından user'a
    // otomatik kopyalanmaz. Bu nedenle role boş gelse bile, Turso DB'de
    // üçlü koşulla (bossEmail + PENDING + bossId IS NULL) eşleştirme yapıyoruz.
    if (role !== "boss" && email) {
      const pendingOrgCheck = await db.select()
        .from(organizations)
        .where(and(
          eq(organizations.bossEmail, email),
          eq(organizations.status, "PENDING"),
          isNull(organizations.bossId),   // Sadece gerçekten bağlanmamış org'u yakala
        ))
        .get();

      if (pendingOrgCheck) {
        console.log(`[ClerkWebhook] 👑 BOSS confirmed via DB email match (bossEmail=${email}, org=${pendingOrgCheck.id})`);
        role = "boss";
      }
    }

    // Davet edilen tüm roller için (CUSTOMER, CASHIER, MANAGER) yerel davetiyeyi ACCEPTED yap
    if (email) {
      await db.update(invitations)
        .set({ status: "ACCEPTED" })
        .where(and(
          eq(invitations.email, email.trim().toLowerCase()),
          eq(invitations.status, "PENDING")
        ));
      console.log(`[ClerkWebhook] 🏁 Local pending invitations auto-accepted for email: ${email}`);
    }

    if (role === "boss") {
      try {
        const client = await clerkClient();
        const orgId = (data.public_metadata?.orgId as string) || "";
        console.log(`[ClerkWebhook] 🏢 BOSS flow triggered. Metadata OrgId: ${orgId}`);

        let linkedOrgId: string | null = null;

        // 🔄 BOSS + Askıdaki Organizasyon Atomik Bağlama (Transaction)
        await db.transaction(async (tx) => {
          // 1. Yerel DB'ye BOSS olarak yaz / güncelle
          await tx.insert(users).values({
            clerkId,
            email,
            username,
            role: "BOSS",
            name,
            imageUrl,
          })
            .onConflictDoUpdate({
              target: users.clerkId,
              set: { role: "BOSS", name, email, username, imageUrl },
            });

          const dbUser = (await tx.select().from(users).where(eq(users.clerkId, clerkId)).get())!;
          console.log(`[ClerkWebhook] 👤 BOSS upserted in local DB: ${dbUser.id}`);

          // 2. Organizasyonu bul: önce orgId metadata ile, sonra email eşleşmesi ile
          let pendingOrg = null;

          if (orgId) {
            pendingOrg = await tx.select()
              .from(organizations)
              .where(and(
                eq(organizations.id, orgId),
                isNull(organizations.bossId),   // Zaten bağlıysa dokunma
              ))
              .get();
          }

          if (!pendingOrg && email) {
            pendingOrg = await tx.select()
              .from(organizations)
              .where(and(
                eq(organizations.bossEmail, email),
                eq(organizations.status, "PENDING"),
                isNull(organizations.bossId),
              ))
              .get();
          }

          if (pendingOrg) {
            await tx.update(organizations)
              .set({ bossId: dbUser.id, status: "ACTIVE" })
              .where(eq(organizations.id, pendingOrg.id));

            linkedOrgId = pendingOrg.id;
            console.log(`[ClerkWebhook] ⛓️ Linked BOSS ${dbUser.id} → Org ${pendingOrg.id} (${pendingOrg.name})`);

            // Yerel davetiyeyi de ACCEPTED yap
            await tx.update(invitations)
              .set({ status: "ACCEPTED" })
              .where(and(
                eq(invitations.email, email),
                eq(invitations.organizationId, pendingOrg.id),
                eq(invitations.status, "PENDING")
              ));
          } else {
            console.warn(`[ClerkWebhook] ⚠️ No unlinked pending org found for email=${email}, orgId=${orgId}`);
          }
        });

        // 3. Clerk tarafında non-blocking işlemler (transaction dışında — hata olsa akış durmasın)
        // Her işlem kendi izole try-catch'i ile zırhlandı: biri başarısız olsa diğeri çalışmaya devam eder.
        void (async () => {
          // 3a. Clerk publicMetadata mühürleme — sonraki oturumlarda token dolu gelsin
          try {
            await client.users.updateUserMetadata(clerkId, {
              publicMetadata: {
                role: "boss",
                ...(linkedOrgId ? { orgId: linkedOrgId } : {}),
              },
            });
            console.log(`[ClerkWebhook] 🏆 Clerk metadata successfully synced for boss=${clerkId}`);
          } catch (clerkErr) {
            // Hata Turso DB commit'ini bozmaz — sadece loglarda görünür
            console.error(`[ClerkWebhook] ⚠️ Failed to update Clerk metadata in background:`, clerkErr);
          }

          // 3b. Clerk org:admin membership — bağımsız, metadata hatasından etkilenmez
          if (linkedOrgId) {
            try {
              await client.organizations.createOrganizationMembership({
                organizationId: linkedOrgId,
                userId: clerkId,
                role: "org:admin",
              });
              console.log(`[ClerkWebhook] 🏢 Clerk org membership created: ${clerkId} → ${linkedOrgId}`);
            } catch (membershipErr) {
              console.error(`[ClerkWebhook] ⚠️ Failed to create Clerk org membership in background:`, membershipErr);
            }
          }
          // 3c. Phone → Username otomatik set
          // DB transaction commit sonrası yapılır — hata webhook'u bozmaz.
          const phoneForUsername = (data.public_metadata?.phone as string) || "";
          if (phoneForUsername && /^90[0-9]{10}$/.test(phoneForUsername)) {
            try {
              await client.users.updateUser(clerkId, { username: phoneForUsername });
              console.log(`[ClerkWebhook] 📱 Username set to phone number for BOSS ${clerkId}: ${phoneForUsername}`);
            } catch (usernameErr: unknown) {
              // unique constraint veya başka hata — sessizce logla, webhook'u patlatma
              console.warn(`[ClerkWebhook] ⚠️ Could not set username (phone) for BOSS ${clerkId}:`, usernameErr instanceof Error ? usernameErr.message : usernameErr);
            }
          }
        })();

        return NextResponse.json({ success: true, message: "BOSS synced and organization linked." });
      } catch (dbErr) {
        console.error("[ClerkWebhook] ❌ Transaction failed during BOSS sync:", dbErr);
        return NextResponse.json({ error: "Database transaction failed" }, { status: 500 });
      }
    } else {
      console.log(`[ClerkWebhook] ℹ️ User is not BOSS (role="${role || "none"}"), skipping org bind.`);
    }

    // ─── Non-BOSS kullanıcılar için Phone → Username otomatik set ─────────────
    // BOSS için yukarıdaki void bloğunda yapıldı. Burası CUSTOMER / CASHIER / MANAGER için.
    // DB sync organizationMembership.created'da gerçekleştiğinden, sadece username'i set ediyoruz.
    if (role !== "boss") {
      const phoneForUsername = (data.public_metadata?.phone as string) || "";
      if (phoneForUsername && /^90[0-9]{10}$/.test(phoneForUsername)) {
        void (async () => {
          try {
            const client = await clerkClient();
            await client.users.updateUser(clerkId, { username: phoneForUsername });
            console.log(`[ClerkWebhook] 📱 Username set to phone number for ${role || "user"} ${clerkId}: ${phoneForUsername}`);
          } catch (usernameErr: unknown) {
            console.warn(`[ClerkWebhook] ⚠️ Could not set username (phone) for ${clerkId}:`, usernameErr instanceof Error ? usernameErr.message : usernameErr);
          }
        })();
      }
    }
  }

  if (type === "user.updated") {
    const clerkId = data.id || "";
    const email = data.email_addresses?.[0]?.email_address?.toLowerCase() || "";
    const firstName = ((data as Record<string, unknown>).first_name as string) || "";
    const lastName = ((data as Record<string, unknown>).last_name as string) || "";
    const name = `${firstName} ${lastName}`.trim() || null;
    const username = data.username || null;
    const imageUrl = ((data as Record<string, unknown>).image_url as string) || null;

    console.log(`[ClerkWebhook] 👤 User updated event: ClerkId=${clerkId}, Email=${email}, Username=${username}, Name=${name}, ImageUrl=${imageUrl}`);

    // Sadece kullanıcı yerel veritabanında zaten varsa güncelle (yoksa insert etmek tutarsızlığa yol açabilir)
    const existingUser = await db.select().from(users).where(eq(users.clerkId, clerkId)).get();
    if (existingUser) {
      await db.update(users)
        .set({
          email,
          name,
          username,
          imageUrl,
        })
        .where(eq(users.clerkId, clerkId));
      console.log(`[ClerkWebhook] 👤 Updated local user details for ClerkId=${clerkId}`);
    } else {
      console.log(`[ClerkWebhook] ℹ️ User ${clerkId} not found in local DB, skipping update.`);
    }
  }

  if (type === "organizationMembership.created" || type === "organizationMembership.updated") {
    const anyData = data;
    const clerkUserId = anyData.public_user_data?.user_id as string;
    const email = (anyData.public_user_data?.identifier?.toLowerCase() || "") as string;
    const orgId = anyData.organization?.id as string;

    const metadata = anyData.public_metadata || {};
    const orgRole = (anyData as Record<string, unknown>).role as string || "";
    const isBossMember = orgRole === "org:admin" || orgRole === "admin" || metadata.role === "boss";

    const targetBranchIds = metadata.targetBranchIds as string[];

    const rawPublicUser = (anyData.public_user_data as Record<string, unknown>) || {};
    const rawData = (anyData as Record<string, unknown>) || {};

    const firstName = (rawPublicUser.first_name as string) || (rawData.first_name as string) || "";
    const lastName = (rawPublicUser.last_name as string) || (rawData.last_name as string) || "";
    const name = `${firstName} ${lastName}`.trim();
    const imageUrl = (rawPublicUser.image_url as string) || (rawData.image_url as string) || null;

    const hasNameInPayload =
      rawPublicUser.first_name !== undefined ||
      rawPublicUser.last_name !== undefined ||
      rawData.first_name !== undefined ||
      rawData.last_name !== undefined;

    const username = anyData.public_user_data?.username || null;

    console.log(`[ClerkWebhook] 🏢 Organization Membership Synced: ClerkId=${clerkUserId}, Email=${email}, Username=${username}, OrgRole=${orgRole}, IsBoss=${isBossMember}, Branches=${targetBranchIds}, Name=${name}, ImageUrl=${imageUrl}`);

    if (clerkUserId && isBossMember) {
      try {
        await db.transaction(async (tx) => {
          // 1. Yerel veritabanında kullanıcıyı BOSS olarak kaydet / güncelle
          await tx.insert(users).values({
            clerkId: clerkUserId,
            email: email,
            username: username,
            role: "BOSS",
            name: name || null,
            imageUrl,
          })
            .onConflictDoUpdate({
              target: users.clerkId,
              set: {
                role: "BOSS",
                name: name || null,
                email: email,
                username: username,
                imageUrl,
              }
            });

          const dbUser = (await tx.select().from(users).where(eq(users.clerkId, clerkUserId)).get())!;
          console.log(`[ClerkWebhook] 👤 Created/Updated local BOSS user via membership event: ${dbUser.id}`);

          // 2. Askıdaki organizasyonu e-posta veya organizasyon kimliği üzerinden bul ve bağla
          const pendingOrg = await tx.select()
            .from(organizations)
            .where(eq(organizations.id, orgId))
            .get();

          if (pendingOrg && (!pendingOrg.bossId || pendingOrg.status === "PENDING")) {
            console.log(`[ClerkWebhook] 🏢 Pending organization found for BOSS membership bind: ${pendingOrg.name}`);
            await tx.update(organizations)
              .set({
                bossId: dbUser.id,
                status: "ACTIVE",
              })
              .where(eq(organizations.id, orgId));
            console.log(`[ClerkWebhook] ⛓️ Linked BOSS ${dbUser.id} to organization ${orgId}`);

            // Yerel davetiyeyi de ACCEPTED yap
            await tx.update(invitations)
              .set({ status: "ACCEPTED" })
              .where(and(
                eq(invitations.email, email),
                eq(invitations.organizationId, orgId),
                eq(invitations.status, "PENDING")
              ));
          } else if (!pendingOrg && orgId) {
            // 🛡️ KRİTİK KORUMA: Turso'da org kaydı yoksa Clerk'ten adı çekip anında insert et.
            // Bu durum; webhook sırasının ters gelmesi veya org'un harici oluşturulması
            // senaryolarında yaşanır. Sistemi kırma — org satırını kendi oluştur.
            let clerkOrgName = `Org-${orgId}`;
            try {
              const client = await clerkClient();
              const clerkOrg = await client.organizations.getOrganization({ organizationId: orgId });
              clerkOrgName = clerkOrg.name;
            } catch (clerkFetchErr) {
              console.warn(`[ClerkWebhook] ⚠️ Could not fetch org name from Clerk, using fallback: ${clerkFetchErr}`);
            }

            await tx.insert(organizations).values({
              id: orgId,
              name: clerkOrgName,
              bossId: dbUser.id,
              bossEmail: email,
              branchLimit: 3,
              isActive: true,
              status: "ACTIVE",
            }).onConflictDoNothing();

            console.log(`[ClerkWebhook] 🏗️ Created missing org in Turso: ${orgId} (${clerkOrgName}) → BOSS ${dbUser.id}`);
          }
        });

        return NextResponse.json({ success: true, message: "BOSS membership synced and linked successfully." });
      } catch (err) {
        console.error("[ClerkWebhook] ❌ BOSS membership sync failed:", err);
        return NextResponse.json({ error: "BOSS membership sync failed" }, { status: 500 });
      }
    }

    const staffRole = ((metadata.role as string) || "CASHIER") as "CASHIER" | "MANAGER";

    if (clerkUserId && staffRole && (staffRole === "MANAGER" || staffRole === "CASHIER")) {
      try {
        let dbUserId = "";

        // 1. Local User Upsert
        await db.transaction(async (tx) => {
          const updateFields: { role: "CASHIER" | "MANAGER"; name?: string | null; email: string; username?: string | null; imageUrl?: string | null } = { role: staffRole, email, username, imageUrl };
          if (hasNameInPayload) {
            updateFields.name = name || null;
          }

          await tx.insert(users).values({
            clerkId: clerkUserId,
            email: email,
            username,
            role: staffRole,
            name: name || null,
            imageUrl,
          })
            .onConflictDoUpdate({
              target: users.clerkId,
              set: updateFields
            });

          const dbUser = (await tx.select().from(users).where(eq(users.clerkId, clerkUserId)).get())!;
          console.log(`[ClerkWebhook] 👤 Created/Updated local staff user: ${dbUser.id}`);
          dbUserId = dbUser.id;
        });

        // 2. Junction Table Sync
        if (dbUserId && targetBranchIds && targetBranchIds.length > 0) {
          const { staffService } = await import("@/lib/services/staff-service");
          const org = await db.select().from(organizations).where(eq(organizations.id, orgId)).get();

          if (org && org.bossId) {
            await staffService.assignStaffToBranches(org.bossId, org.id, dbUserId, targetBranchIds);
            console.log(`[ClerkWebhook] ⛓️ Staff assigned to branches successfully.`);
          } else {
            console.warn(`[ClerkWebhook] ⚠️ No local boss found for org ${orgId}`);
          }
        }
      } catch (err) {
        console.error("[ClerkWebhook] ❌ Staff sync failed:", err);
        return NextResponse.json({ error: "Staff sync failed" }, { status: 500 });
      }
    }
  }

  if (type === "organizationMembership.deleted") {
    const anyData = data;
    const clerkUserId = anyData.public_user_data?.user_id as string;
    const orgId = anyData.organization?.id as string;

    console.log(`[ClerkWebhook] 🏢 Organization Membership Deleted: ClerkId=${clerkUserId}, OrgId=${orgId}`);

    if (clerkUserId && orgId) {
      try {
        await db.transaction(async (tx) => {
          const dbUser = await tx.select().from(users).where(eq(users.clerkId, clerkUserId)).get();
          if (!dbUser) return;

          const deletedJunctions = await tx.delete(userBranches).where(
            and(
              eq(userBranches.userId, dbUser.id),
              inArray(
                userBranches.branchId,
                tx.select({ id: branches.id }).from(branches).where(eq(branches.orgId, orgId))
              )
            )
          ).returning();

          console.log(`[ClerkWebhook] 🧹 Cleared ${deletedJunctions.length} branch assignments for user ${dbUser.id} in org ${orgId}`);

          // Ghost Staff Prevention
          const remainingBranches = await tx.select().from(userBranches).where(eq(userBranches.userId, dbUser.id)).limit(1).get();
          if (!remainingBranches) {
            await tx.delete(users).where(eq(users.id, dbUser.id));
            console.log(`[ClerkWebhook] 👻 User ${dbUser.id} has no remaining branches. User record deleted (Ghost Staff prevention).`);
          }
        });
      } catch (err) {
        console.error("[ClerkWebhook] ❌ Staff cleanup failed:", err);
        return NextResponse.json({ error: "Staff cleanup failed" }, { status: 500 });
      }
    }
  }

  if (type === "invitation.accepted" || type === "organizationInvitation.accepted") {
    const invitationId = data.id;
    if (invitationId) {
      await db.update(invitations)
        .set({ status: "ACCEPTED" })
        .where(eq(invitations.clerkInviteId, invitationId));
      console.log(`[ClerkWebhook] 📩 Invitation ${invitationId} accepted.`);
    }
  }

  if (
    type === "invitation.revoked" ||
    type === "organizationInvitation.revoked" ||
    type === "organizationInvitation.expired"
  ) {
    const invitationId = data.id;
    if (invitationId) {
      const newStatus = type.includes("expired") ? "EXPIRED" : "REVOKED";
      await db.update(invitations)
        .set({ status: newStatus })
        .where(eq(invitations.clerkInviteId, invitationId));
      console.log(`[ClerkWebhook] 📩 Invitation ${invitationId} updated to ${newStatus}.`);
    }
  }

  return NextResponse.json({ success: true, message: "Webhook processed." });
}
