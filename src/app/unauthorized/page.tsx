import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, pendingInvitations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UnauthorizedClient } from "./unauthorized-client";

export default async function UnauthorizedPage() {
  let isPending = false;

  try {
    const { userId } = await auth();

    if (userId) {
      // 1. Clerk üzerinden kullanıcının e-postasını sorgula
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase().trim() || "";
      
      // Super Admin koruması (Novexis ekibi ve env dosyasında tanımlı olanlar kazınmasın)
      const isSuperAdminEmail = email === "novexistech@gmail.com" || (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).includes(email);

      if (!isSuperAdminEmail) {
        // 2. Kullanıcının yerel DB rolünü sorgula
        const dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();

        // 3. Kullanıcının yerel pending_invitations tablosunda davet kaydı olup olmadığını sorgula
        const isInvited = await db.select().from(pendingInvitations).where(eq(pendingInvitations.email, email)).get();

        if (isInvited) {
          // Daveti var fakat henüz webhook/senkronizasyon tamamlanmamış (yarış durumu / webhook gecikmesi)
          // Bu kullanıcı meşrudur, KESİNLİKLE SİLİNMEYECEKTİR!
          isPending = true;
          console.log(`[Server-Cleansing] ⏳ Meşru kullanıcı bekletiliyor: ${email} (${userId}). Davetiye mevcut fakat yerel users kaydı henüz tamamlanmamış.`);
        } else if (!dbUser || !dbUser.role) {
          // Ne davetiyesi var ne de veritabanında kaydı/rolü var -> %100 KAÇAK KULLANICI!
          console.warn(`[Server-Cleansing] 💀 Otonom İmha: Kaçak kullanıcı saptandı: ${email} (${userId}). Clerk'ten tamamen kazınıyor!`);
          await client.users.deleteUser(userId);
          console.log(`[Server-Cleansing] 💀 Otonom İmha: ${userId} hesabı Clerk'ten o saniye silindi.`);
        }
      }
    }
  } catch (error) {
    console.error("[Server-Cleansing] ❌ Akıllı imha motorunda hata:", error);
  }

  return <UnauthorizedClient isPending={isPending} />;
}
