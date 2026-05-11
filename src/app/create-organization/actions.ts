"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function createBossOrganization(name: string, slug: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Yetkisiz erişim." };

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = (user.publicMetadata || {}) as Record<string, unknown>;

  if (meta.role !== "boss") {
    return { error: "Yalnızca davet edilmiş Patronlar organizasyon oluşturabilir." };
  }

  const email = user.primaryEmailAddress?.emailAddress || "";

  try {
    // 1. Clerk'te organizasyonu oluştur
    const org = await client.organizations.createOrganization({
      name,
      slug,
      createdBy: userId, // Bu kullanıcıyı otomatik org:admin yapar
    });

    // 2. Turso veritabanına kaydet
    await db.insert(organizations).values({
      id: org.id,
      name,
      slug,
      bossEmail: email,
      isActive: true,
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Boss org creation error:", error);
    return { error: error.errors?.[0]?.message || error.message || "Organizasyon oluşturulamadı." };
  }
}
