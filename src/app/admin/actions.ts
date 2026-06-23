"use server";

import { adminService } from "@/lib/services/admin-service";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function inviteBossAction(companyName: string, email: string, phone: string): Promise<{ success: boolean; scenario?: "NEW_BOSS" | "EXISTING_BOSS" | "DUPLICATE_INVITATION"; message?: string; error?: string }> {
  console.log("⚙️ [Server Action]: inviteBossAction tetiklendi, parametreler:", { companyName, email, phone });
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Oturum bulunamadı. Lütfen giriş yapın." };
    }

    // Action katmanında SUPER_ADMIN rol kontrolü guard'ı
    const dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();
    if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
      return { success: false, error: "Bu işlem için yetkiniz bulunmamaktadır." };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL environment variable is not set");
    }

    const res = await adminService.inviteBoss(companyName, email, appUrl, phone);
    if (res.success) {
      revalidatePath("/admin");
    }
    return res;
  } catch (error: unknown) {
    return { success: false, error: (error instanceof Error ? error.message : "Bilinmeyen hata") };
  }
}

export async function toggleOrgStatus(orgId: string, currentStatus: boolean) {
  try {
    const res = await adminService.toggleOrgStatus(orgId, currentStatus);
    revalidatePath("/admin");
    return res;
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Bilinmeyen hata") };
  }
}

export async function updateBranchLimitAction(orgId: string, newLimit: number) {
  try {
    const res = await adminService.updateBranchLimit(orgId, newLimit);
    revalidatePath("/admin");
    return res;
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Bilinmeyen hata") };
  }
}

export async function revokeBossInvitation(invitationId: string, organizationId?: string) {
  try {
    const res = await adminService.revokeBossInvitation(invitationId, organizationId);
    revalidatePath("/admin");
    return res;
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Bilinmeyen hata") };
  }
}

export async function getInvitedBosses() {
  try {
    return await adminService.getInvitedBosses();
  } catch {
    return [];
  }
}

export async function getAllOrganizations() {
  try {
    return await adminService.getAllOrganizations();
  } catch {
    return [];
  }
}

export async function getGlobalAnalytics() {
  try {
    return await adminService.getGlobalAnalytics();
  } catch (error) {
    console.error("Global analytics error:", error);
    return null;
  }
}

