"use server";

import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, branches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { staffService } from "@/lib/services/staff-service";

export async function setActiveBranchContextAction(branchId: string) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId) {
      throw new Error("Oturum bulunamadı");
    }

    if (!orgId) {
      throw new Error("Aktif organizasyon bulunamadı");
    }

    // Cross-Org Cookie Cross-Contamination Guard
    const branch = await db.select().from(branches).where(eq(branches.id, branchId)).get();
    if (!branch || branch.orgId !== orgId) {
      throw new Error("Geçersiz şube veya farklı bir organizasyona ait şubeye geçiş engellendi.");
    }

    const dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();
    if (!dbUser) {
      throw new Error("Kullanıcı bulunamadı");
    }

    // Katı Yetki Doğrulaması
    await staffService.requireBranchAccess(dbUser.id, dbUser.role, branchId);

    // Güvenli Mühürleme
    const cookieStore = await cookies();
    cookieStore.set("active_branch_id", branchId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[SetActiveBranchContextAction] Error:", err.message);
    throw new Error(err.message || "Bilinmeyen hata oluştu");
  }
}

export async function getActiveBranchContextAction() {
  const cookieStore = await cookies();
  return cookieStore.get("active_branch_id")?.value;
}
