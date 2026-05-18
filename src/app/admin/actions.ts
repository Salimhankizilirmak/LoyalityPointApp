"use server";

import { adminService } from "@/lib/services/admin-service";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function inviteBossAction(companyName: string, email: string): Promise<{ success: boolean; scenario?: "NEW_BOSS" | "EXISTING_BOSS"; message?: string; error?: string }> {
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

    const headerList = await headers();
    const host = headerList.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const appUrl = `${protocol}://${host}`;

    return await adminService.inviteBoss(companyName, email, appUrl);
  } catch (error: unknown) {
    return { success: false, error: (error instanceof Error ? error.message : "Bilinmeyen hata") };
  }
}

export async function toggleOrgStatus(orgId: string, currentStatus: boolean) {
  try {
    return await adminService.toggleOrgStatus(orgId, currentStatus);
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Bilinmeyen hata") };
  }
}

export async function updateBranchLimitAction(orgId: string, newLimit: number) {
  try {
    return await adminService.updateBranchLimit(orgId, newLimit);
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Bilinmeyen hata") };
  }
}

export async function revokeBossInvitation(invitationId: string) {
  try {
    return await adminService.revokeBossInvitation(invitationId);
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
