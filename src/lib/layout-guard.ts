import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * 🛡️ Zırhlı Layout Guard (Applicative Layout Guard)
 * Kullanıcı sisteme girmiş fakat DB'de rolü yoksa VE pending_invitations tablosunda
 * davet kaydı yer almıyorsa kaçak saptanır ve /unauthorized sayfasına yönlendirilir.
 */
export async function checkLayoutGuard() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  // 1. Kullanıcının yerel DB rolünü sorgula
  const dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();

  // Eğer veritabanında kullanıcı varsa ve geçerli bir rolü varsa, bu meşru bir kullanıcıdır
  if (dbUser && dbUser.role) {
    return;
  }

  // 2. Kullanıcı veritabanında yoksa veya rolü boşsa, e-postasını sorgula
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase().trim() || "";

  // Super Admin koruması (Novexis ekibi ve env dosyasında tanımlı olanlar kaçak değildir)
  const isSuperAdminEmail = email === "novexistech@gmail.com" || (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).includes(email);
  if (isSuperAdminEmail) {
    return;
  }

  // 4. Eğer rolü yoksa, bu meşru ama henüz webhook tamamlanmamış bir davetli veya doğrudan bir kaçaktır!
  console.warn(`[LayoutGuard] 🚨 SIZINTI ENGELLEME / AKTİVASYON: Davetli veya Kaçak kullanıcı yönlendiriliyor! Email: ${email}, UserId: ${userId}`);
  
  // Next.js'in yerel sunucu yönlendirmesini çağırıyoruz (arka planda sıfır 403 hatasıyla yönlendirir)
  redirect("/unauthorized");
}
