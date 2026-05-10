"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function createOrganizationAction(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Yetkisiz erişim." };
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";

  const envEmails = process.env.SUPER_ADMIN_EMAILS || "";
  const allowedEmails = envEmails.split(",").map((e) => e.trim().toLowerCase());

  if (!allowedEmails.includes(email)) {
    return { error: "Bu işlem için Süper Admin yetkisi gereklidir." };
  }

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim().toLowerCase().replace(/\s+/g, "-");
  const bossEmail = (formData.get("bossEmail") as string)?.trim();

  if (!name) return { error: "Firma adı zorunludur." };
  if (!slug) return { error: "URL slug zorunludur." };
  if (!bossEmail || !bossEmail.includes("@")) return { error: "Geçerli bir patron e-postası girin." };

  try {
    // 1. Clerk'te organizasyonu oluştur
    const org = await client.organizations.createOrganization({
      name,
      slug,
      createdBy: userId,
    });

    // 2. Patronu org:admin rolü + boss publicMetadata ile davet et
    await client.organizations.createOrganizationInvitation({
      organizationId: org.id,
      emailAddress: bossEmail,
      role: "org:admin",
      inviterUserId: userId,
      publicMetadata: { role: "boss" },
    });

    // 3. Turso veritabanına kaydet
    await db.insert(organizations).values({
      id: org.id,
      name,
      slug,
      bossEmail,
    });

    revalidatePath("/admin");
    return {
      success: true,
      message: `'${org.name}' başarıyla oluşturuldu ve ${bossEmail} adresine davet gönderildi!`,
    };
  } catch (error: any) {
    console.error("Org creation error:", error);
    return { error: error.errors?.[0]?.message || error.message || "Firma oluşturulurken hata oluştu." };
  }
}

export async function getAllOrganizations() {
  const { userId } = await auth();
  if (!userId) throw new Error("Yetkisiz erişim");

  try {
    const orgs = await db.select().from(organizations).all();
    return orgs;
  } catch {
    return [];
  }
}
