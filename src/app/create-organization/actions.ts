"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function createBossOrganization(name: string, slug: string) {
  const { userId } = await auth();
  console.log(`[CreateOrg] Attempting to create org: ${name} (${slug}) for userId: ${userId}`);
  
  if (!userId) {
    console.log("[CreateOrg] Error: No userId found");
    return { error: "Yetkisiz erişim." };
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = (user.publicMetadata || {}) as Record<string, unknown>;

  if (meta.role !== "boss") {
    console.log(`[CreateOrg] Error: User ${user.primaryEmailAddress?.emailAddress} is not a boss (Role: ${meta.role})`);
    return { error: "Yalnızca davet edilmiş Patronlar organizasyon oluşturabilir." };
  }

  const email = user.primaryEmailAddress?.emailAddress || "";

  try {
    console.log("[CreateOrg] Creating organization in Clerk...");
    // 1. Clerk'te organizasyonu oluştur
    const org = await client.organizations.createOrganization({
      name,
      slug,
      createdBy: userId, // Bu kullanıcıyı otomatik org:admin yapar
    });

    console.log(`[CreateOrg] Clerk Org created: ${org.id}. Saving to database...`);

    // 2. Turso veritabanına kaydet
    await db.insert(organizations).values({
      id: org.id,
      name,
      slug,
      bossEmail: email,
      isActive: true,
    });

    console.log("[CreateOrg] Success: Organization saved to DB and Clerk");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("[CreateOrg] Error caught:", error);
    return { error: error.errors?.[0]?.message || error.message || "Organizasyon oluşturulamadı." };
  }
}
