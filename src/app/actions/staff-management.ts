"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, staffProfiles, userBranches } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteStaffMemberAction(targetUserId: string, targetRole: "MANAGER" | "CASHIER") {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return { success: false, error: "Yetkisiz işlem." };
    }

    const metadata = (sessionClaims?.metadata || {}) as Record<string, unknown>;
    const callerRole = metadata.role as string;
    const orgId = metadata.orgId as string;

    if (!orgId) {
      return { success: false, error: "Organizasyon bulunamadı." };
    }

    // 1. Yetki Kontrolü
    if (callerRole === "boss") {
      if (targetRole !== "MANAGER" && targetRole !== "CASHIER") {
         return { success: false, error: "Geçersiz hedef rol." };
      }
    } else if (callerRole === "manager") {
      if (targetRole !== "CASHIER") {
         return { success: false, error: "Sadece kasiyerleri silebilirsiniz." };
      }
    } else {
      return { success: false, error: "Personel silme yetkiniz yok." };
    }

    // 2. Hedef kullaniciyi db'den bul
    const targetUser = await db.select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .get();

    if (!targetUser) {
      return { success: false, error: "Kullanıcı bulunamadı." };
    }
    
    // Organizasyon içi kontrolü
    const targetStaffProfile = await db.select()
      .from(staffProfiles)
      .where(and(
         eq(staffProfiles.userId, targetUser.id),
      ))
      .get();
      
    if (!targetStaffProfile) {
       return { success: false, error: "Bu personeli silme yetkiniz yok veya organizasyonunuza ait değil." };
    }

    const targetClerkId = targetUser.clerkId;

    // 3. Veritabanindan sil
    await db.delete(userBranches).where(eq(userBranches.userId, targetUser.id));
    await db.delete(staffProfiles).where(eq(staffProfiles.userId, targetUser.id));
    await db.delete(users).where(eq(users.id, targetUser.id));

    // 4. Clerk'ten sil
    if (targetClerkId) {
      try {
        const client = await clerkClient();
        await client.users.deleteUser(targetClerkId);
        console.log(`[StaffManagement] Clerk user deleted: ${targetClerkId}`);
      } catch (clerkErr: any) {
        console.warn(`[StaffManagement] Clerk deleteUser error (Kullanıcı zaten silinmiş olabilir):`, clerkErr.message);
      }
    }

    revalidatePath("/(manager)/manager-dashboard/team", "page");
    revalidatePath("/(boss)/boss-dashboard/team", "page");

    return { success: true, message: "Personel kalıcı olarak silindi." };

  } catch (error: any) {
    console.error("[deleteStaffMemberAction] Error:", error);
    return { success: false, error: error.message || "Bilinmeyen bir hata oluştu." };
  }
}

export async function updateStaffNameAction(memberId: string, newName: string) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { success: false, error: "Yetkisiz işlem." };

    const metadata = (sessionClaims?.metadata || {}) as Record<string, unknown>;
    const callerRole = metadata.role as string;
    
    if (callerRole !== "boss") {
      return { success: false, error: "Bu işlem için yetkiniz yok." };
    }

    const { staffService } = await import("@/lib/services/staff-service");
    
    const parts = newName.trim().split(" ");
    const firstName = parts[0];
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";

    await staffService.updateMemberName(memberId, firstName, lastName);

    revalidatePath("/boss-dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Update staff name action error:", error);
    return { success: false, error: error.message || "İsim güncellenirken bir hata oluştu." };
  }
}
