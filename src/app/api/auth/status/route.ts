import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  console.log("[StatusAPI] 🔍 Check sync status requested.");

  try {
    const { userId } = await auth();

    if (!userId) {
      console.warn("[StatusAPI] 🛑 No clerk session found.");
      return NextResponse.json({ synced: false, error: "Oturum bulunamadı." }, { status: 401 });
    }

    // 1. Yerel veritabanında kullanıcıyı sorgula (Strictly Read-Only)
    const dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();

    if (!dbUser) {
      console.log(`[StatusAPI] ⏳ Local user record not found yet for clerkId: ${userId}`);
      return NextResponse.json({ synced: false });
    }

    console.log(`[StatusAPI] 👤 Local user found: Id=${dbUser.id}, Role=${dbUser.role}`);

    // 2. Eğer rol BOSS ise, askıdaki organizasyonun bağlanıp bağlanmadığını doğrula
    if (dbUser.role === "BOSS") {
      const dbOrg = await db.select().from(organizations).where(eq(organizations.bossId, dbUser.id)).get();

      if (!dbOrg) {
        console.log(`[StatusAPI] ⏳ Organization not linked yet for BOSS user: ${dbUser.id}`);
        return NextResponse.json({ synced: false });
      }

      console.log(`[StatusAPI] 🏢 Linked organization found: Name=${dbOrg.name}, Id=${dbOrg.id}`);
    }

    // Kullanıcı mevcut ve BOSS ise organizasyonu da bağlanmış -> Senkronizasyon Tamamlandı!
    console.log("[StatusAPI] ✅ Synchronization verified successfully!");
    return NextResponse.json({ synced: true });

  } catch (error) {
    console.error("[StatusAPI] ❌ Failed to check sync status:", error);
    return NextResponse.json({ synced: false, error: "Sunucu hatası" }, { status: 500 });
  }
}
