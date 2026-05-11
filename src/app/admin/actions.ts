"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { headers } from "next/headers";

async function checkSuperAdmin() {
  const { userId } = await auth();
  if (!userId) {
    console.log("[AuthCheck] No userId found");
    return false;
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";

  const envEmails = process.env.SUPER_ADMIN_EMAILS || "";
  const allowedEmails = envEmails.split(",").map((e) => e.trim().toLowerCase());

  const isSuper = allowedEmails.includes(email);
  console.log(`[AuthCheck] User: ${email}, isSuperAdmin: ${isSuper}`);
  return isSuper;
}

export async function inviteBossAction(email: string) {
  console.log(`[InviteBoss] Starting invitation for: ${email}`);
  if (!(await checkSuperAdmin())) {
    return { error: "Bu işlem için Süper Admin yetkisi gereklidir." };
  }

  const client = await clerkClient();
  const headerList = await headers();
  const host = headerList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const appUrl = `${protocol}://${host}`;

  try {
    console.log(`[InviteBoss] Invitation redirectUrl set to: ${appUrl}/dashboard`);
    await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { role: "boss" },
      redirectUrl: `${appUrl}/dashboard`,
    });

    console.log(`[InviteBoss] Success: Invitation sent to ${email}`);
    revalidatePath("/admin");
    return {
      success: true,
      message: `${email} adresine Patron daveti gönderildi!`,
    };
  } catch (error: any) {
    console.error("[InviteBoss] Error caught:", error);
    const clerkError = error.errors?.[0];
    if (clerkError?.code === "duplicate_record") {
      return { error: "Bu e-posta adresine zaten aktif bir davet gönderilmiş. Onaylanması bekleniyor." };
    }
    return { error: clerkError?.message || error.message || "Davet gönderilemedi." };
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

export async function getInvitedBosses() {
  if (!(await checkSuperAdmin())) throw new Error("Yetkisiz erişim");

  const client = await clerkClient();
  
  try {
    // 1. Bekleyen Davetler
    const invitations = await client.invitations.getInvitationList({
      status: "pending",
    });

    // 2. Sisteme Kayıt Olmuş Patronlar (metadata'da role: boss olanlar)
    const users = await client.users.getUserList({
      limit: 100,
    });

    const bossUsers = users.data.filter(u => 
      (u.publicMetadata as any)?.role === "boss"
    );

    const pending = invitations.data.map(inv => ({
      id: inv.id,
      email: inv.emailAddress,
      status: "pending" as const,
      createdAt: inv.createdAt,
    }));

    const active = bossUsers.map(u => ({
      id: u.id,
      email: u.emailAddresses[0]?.emailAddress || "",
      status: "accepted" as const,
      createdAt: u.createdAt,
      lastSignIn: u.lastSignInAt,
    }));

    return [...pending, ...active].sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Fetch invited bosses error:", error);
    return [];
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
