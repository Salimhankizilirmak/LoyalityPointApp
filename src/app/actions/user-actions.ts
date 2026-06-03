"use server";

import { clerkClient, auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

interface UpdateUserProfileResult {
  success: boolean;
  error?: string;
}

export async function updateUserProfile(
  firstName: string,
  lastName: string,
  phone: string,
  smsAllowed: boolean,
  emailAllowed: boolean,
  username?: string
): Promise<UpdateUserProfileResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Oturum bulunamadı. Lütfen tekrar giriş yapın." };
    }

    const client = await clerkClient();

    // Clerk API güncel metadata'larını korumak için mevcut kullanıcının unsafeMetadata bilgisini alıyoruz
    const clerkUser = await client.users.getUser(userId);
    const existingUnsafeMetadata = clerkUser.unsafeMetadata || {};

    const updateData: Record<string, any> = {
      firstName,
      lastName,
      unsafeMetadata: {
        ...existingUnsafeMetadata,
        phone: phone.trim(),
        marketingSms: smsAllowed,
        marketingEmail: emailAllowed,
      }
    };

    // Eğer başlangıçta kullanıcı adı yoksa ve yeni bir kullanıcı adı girilmişse Clerk'e gönder
    if (!clerkUser.username && username) {
      updateData.username = username.trim().toLowerCase();
    }

    // 1. Clerk üzerinde kullanıcı bilgilerini güncelle (Server-side)
    await client.users.updateUser(userId, updateData);

    // 2. Yerel veritabanında da bilgileri senkronize et
    await db.update(users)
      .set({
        name: `${firstName} ${lastName}`.trim(),
        username: updateData.username || clerkUser.username || undefined,
      })
      .where(eq(users.clerkId, userId));

    console.log(`[user-actions] 👤 Updated user profile on Clerk and Local DB for user: ${userId}`);
    return { success: true };
  } catch (error: any) {
    console.error("[user-actions] ❌ Error updating user profile:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Profil güncellenirken bir hata oluştu." 
    };
  }
}
