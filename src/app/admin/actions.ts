"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

async function checkSuperAdmin() {
  const { userId } = await auth();
  if (!userId) return false;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";

  const envEmails = process.env.SUPER_ADMIN_EMAILS || "";
  const allowedEmails = envEmails.split(",").map((e) => e.trim().toLowerCase());

  return allowedEmails.includes(email);
}

export async function inviteBossAction(email: string) {
  if (!(await checkSuperAdmin())) {
    return { error: "Bu işlem için Süper Admin yetkisi gereklidir." };
  }

  const { userId } = await auth();
  const client = await clerkClient();

  try {
    // 1. Patronu boss publicMetadata ile davet et (organizasyonsuz uygulama daveti)
    await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { role: "boss" },
      // Not: redirectUrl belirtilmezse varsayılan SIGN_UP_URL kullanılır.
    });

    revalidatePath("/admin");
    return {
      success: true,
      message: `${email} adresine Patron daveti gönderildi!`,
    };
  } catch (error: any) {
    console.error("Invitation error:", error);
    return { error: error.errors?.[0]?.message || error.message || "Davet gönderilemedi." };
  }
}

export async function toggleOrgStatus(orgId: string, currentStatus: boolean) {
  if (!(await checkSuperAdmin())) {
    return { error: "Yetkisiz erişim." };
  }

  try {
    await db.update(organizations).set({ isActive: !currentStatus }).where(eq(organizations.id, orgId));
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Toggle org status error:", error);
    return { error: "Durum güncellenemedi." };
  }
}

export async function getAllOrganizations() {
  if (!(await checkSuperAdmin())) throw new Error("Yetkisiz erişim");

  try {
    const orgs = await db.select().from(organizations).all();
    return orgs;
  } catch {
    return [];
  }
}
