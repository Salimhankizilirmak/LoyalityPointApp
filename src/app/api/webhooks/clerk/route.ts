import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, organizations, branches, userBranches, invitations } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
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
    const email = data.email_addresses?.[0]?.email_address || "";

    console.log(`[ClerkWebhook] user.created event triggered. ClerkId: ${clerkId}, Email: ${email}`);

    if (email) {
      try {
        // Yerel invitations tablosunda sorgu yapıp, davet edilirken girilen orijinal telefon numarasını çekiyoruz.
        const inviteRecord = await db.select()
          .from(invitations)
          .where(eq(invitations.email, email.trim().toLowerCase()))
          .get();

        const rawPhone = inviteRecord?.phoneNumber || "";
        console.log(`[ClerkWebhook] Found phone number in invitations: ${rawPhone}`);

        if (rawPhone) {
          // Çekilen telefon numarasındaki tüm boşluk, parantez ve ülke kodlarını temizleyerek başında 0 olan 11 haneli düz rakam formatına (05XXXXXXXXX) getir.
          const digits = rawPhone.replace(/\D/g, "");
          const match = digits.match(/5\d{9}$/);
          if (match) {
            const cleanPhone = "0" + match[0];
            console.log(`[ClerkWebhook] Formatted clean phone: ${cleanPhone}`);

            // clerkClient API'sini kullanarak kullanıcının Clerk profilindeki username alanına güncelle.
            try {
              const client = await clerkClient();
              await client.users.updateUser(clerkId, { username: cleanPhone });
              console.log(`[ClerkWebhook] Clerk username successfully updated to: ${cleanPhone}`);
            } catch (clerkErr: unknown) {
              // Clerk API hata fırlatırsa, hatanın ham JSON detayını console.error ile yazdır.
              console.error("[ClerkWebhook] Clerk API updateUser error:", clerkErr instanceof Error ? clerkErr.message : JSON.stringify(clerkErr));
            }
          } else {
            console.warn(`[ClerkWebhook] Phone number in invitations has an invalid format: ${rawPhone}`);
          }
        } else {
          console.warn(`[ClerkWebhook] No phone number found in invitations for email: ${email}`);
        }
      } catch (dbErr) {
        console.error("[ClerkWebhook] Error querying invitations database:", dbErr);
      }
    } else {
      console.warn("[ClerkWebhook] No email address found in user.created payload");
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
      const updateFields: Record<string, unknown> = {
        email,
        name,
        imageUrl,
      };
      if (username && username.trim() !== "") {
        updateFields.username = username;
      }
      await db.update(users)
        .set(updateFields)
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
          const bossUpdateSet: Record<string, unknown> = {
            role: "BOSS",
            name: name || null,
            email: email,
            imageUrl,
          };
          if (username && username.trim() !== "") {
            bossUpdateSet.username = username;
          }

          await tx.insert(users).values({
            clerkId: clerkUserId,
            email: email,
            username: username || email.split("@")[0].replace(/[^a-zA-Z0-9]/g, ""),
            role: "BOSS",
            name: name || null,
            imageUrl,
          })
            .onConflictDoUpdate({
              target: users.clerkId,
              set: bossUpdateSet,
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
          const updateFields: Record<string, unknown> = { role: staffRole, email, imageUrl };
          if (hasNameInPayload) {
            updateFields.name = name || null;
          }
          if (username && username.trim() !== "") {
            updateFields.username = username;
          }

          await tx.insert(users).values({
            clerkId: clerkUserId,
            email: email,
            username: username || email.split("@")[0].replace(/[^a-zA-Z0-9]/g, ""),
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
