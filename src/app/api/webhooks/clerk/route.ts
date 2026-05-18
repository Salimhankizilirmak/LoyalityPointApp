import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, organizations, branches, userBranches } from "@/db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";

type ClerkPayload = {
  type: string;
  data: {
    id?: string;
    email_addresses?: Array<{ email_address: string }>;
    public_metadata?: Record<string, unknown>;
    public_user_data?: { user_id?: string; identifier?: string };
    organization?: { id?: string };
  };
};

export async function POST(req: Request) {
  console.log("[ClerkWebhook] 📥 Webhook request received.");

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  let payload: ClerkPayload;

  try {
    const body = await req.text();

    if (WEBHOOK_SECRET) {
      // 🔒 Prod Ortamı: Svix ile İmza Doğrulaması
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
      // 🧪 Geliştirme Ortamı: Doğrulamasız Doğrudan İşleme (Mock Webhook veya Local Test için)
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
    const role = (data.public_metadata?.role as string) || "";
    const firstName = ((data as Record<string, unknown>).first_name as string) || "";
    const lastName = ((data as Record<string, unknown>).last_name as string) || "";
    const name = `${firstName} ${lastName}`.trim() || null;

    console.log(`[ClerkWebhook] 👤 New user created event details: ClerkId=${clerkId}, Email=${email}, MetadataRole=${role}, Name=${name}`);

    if (role === "boss") {
      try {
        // 🔄 Drizzle Transaction ile Kullanıcı ve Askıdaki Organizasyon Birleştirilmesi
        await db.transaction(async (tx) => {
          // 1. Yerel veritabanında kullanıcıyı BOSS olarak kaydet
          let dbUser = await tx.select().from(users).where(eq(users.clerkId, clerkId)).get();
          if (!dbUser) {
            const inserted = await tx.insert(users).values({
              clerkId,
              email,
              role: "BOSS",
              name,
            }).returning();
            dbUser = inserted[0];
            console.log(`[ClerkWebhook] 👤 Created local BOSS user: ${dbUser.id}`);
          } else {
            await tx.update(users).set({ role: "BOSS", name }).where(eq(users.id, dbUser.id));
            console.log(`[ClerkWebhook] 👤 Local BOSS user already exists and was updated: ${dbUser.id}`);
          }

          // 2. Askıdaki organizasyonu e-posta üzerinden bul ve bağla
          const pendingOrg = await tx.select()
            .from(organizations)
            .where(and(eq(organizations.bossEmail, email), isNull(organizations.bossId)))
            .get();

          if (pendingOrg) {
            console.log(`[ClerkWebhook] 🏢 Pending organization found: ${pendingOrg.name} (${pendingOrg.id})`);
            await tx.update(organizations)
              .set({
                bossId: dbUser.id,
                bossEmail: null,
              })
              .where(eq(organizations.id, pendingOrg.id));
            console.log(`[ClerkWebhook] ⛓️ Linked BOSS ${dbUser.id} to organization ${pendingOrg.id}`);
          } else {
            console.log(`[ClerkWebhook] ⚠️ No pending organization found for email: ${email}`);
          }
        });

        return NextResponse.json({ success: true, message: "User synced and organization linked successfully." });
      } catch (dbErr) {
        console.error("[ClerkWebhook] ❌ Transaction failed during sync:", dbErr);
        return NextResponse.json({ error: "Database transaction failed" }, { status: 500 });
      }
    } else {
      console.log(`[ClerkWebhook] ℹ️ User role is not boss (${role || "none"}), skipping db binding.`);
    }
  }

  if (type === "organizationMembership.created" || type === "organizationMembership.updated") {
    const anyData = data;
    const clerkUserId = anyData.public_user_data?.user_id as string;
    const email = (anyData.public_user_data?.identifier?.toLowerCase() || "") as string;
    const orgId = anyData.organization?.id as string;
    
    const metadata = anyData.public_metadata || {};
    const role = ((metadata.role as string) || "CASHIER") as "CASHIER" | "MANAGER";
    const targetBranchIds = metadata.targetBranchIds as string[];
    
    const rawPublicUser = (anyData.public_user_data as Record<string, unknown>) || {};
    const rawData = (anyData as Record<string, unknown>) || {};

    const firstName = (rawPublicUser.first_name as string) || (rawData.first_name as string) || "";
    const lastName = (rawPublicUser.last_name as string) || (rawData.last_name as string) || "";
    const name = `${firstName} ${lastName}`.trim();

    const hasNameInPayload = 
      rawPublicUser.first_name !== undefined || 
      rawPublicUser.last_name !== undefined ||
      rawData.first_name !== undefined || 
      rawData.last_name !== undefined;

    console.log(`[ClerkWebhook] 🏢 Organization Membership Synced: ClerkId=${clerkUserId}, Email=${email}, Role=${role}, Branches=${targetBranchIds}, Name=${name}, HasName=${hasNameInPayload}`);

    if (clerkUserId && role && (role === "MANAGER" || role === "CASHIER")) {
      try {
        let dbUserId = "";
        
        // 1. Local User Upsert
        await db.transaction(async (tx) => {
          let dbUser = await tx.select().from(users).where(eq(users.clerkId, clerkUserId)).get();
          if (!dbUser) {
            const inserted = await tx.insert(users).values({
              clerkId: clerkUserId,
              email: email,
              role: role,
              name: name || null,
            }).returning();
            dbUser = inserted[0];
            console.log(`[ClerkWebhook] 👤 Created local staff user: ${dbUser.id}`);
          } else {
            const updateFields: { role: "CASHIER" | "MANAGER"; name?: string | null } = { role: role };
            if (hasNameInPayload) {
              updateFields.name = name || null;
            }
            await tx.update(users).set(updateFields).where(eq(users.id, dbUser.id));
            console.log(`[ClerkWebhook] 👤 Updated local staff user: ${dbUser.id}`);
          }
          dbUserId = dbUser.id;
        });

        // 2. Junction Table Sync
        if (dbUserId && targetBranchIds && targetBranchIds.length > 0) {
          const { staffService } = await import("@/lib/services/staff-service");
          const org = await db.select().from(organizations).where(eq(organizations.id, orgId)).get();
          
          if (org && org.bossId) {
            // Arka planda programatik olarak staffService tetiklenir
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

          // Delete userBranches using subquery for the specific org
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
            // Delete the user record completely if they have no remaining branches
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

  return NextResponse.json({ success: true, message: "Webhook processed." });
}
