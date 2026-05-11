import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardRedirect() {
  const { userId, orgId, orgRole } = await auth();

  if (!userId) {
    redirect("/");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";

  // 1. Süper Admin Kontrolü
  const envEmails = process.env.SUPER_ADMIN_EMAILS || "";
  const allowedEmails = envEmails.split(",").map(e => e.trim().toLowerCase());

  if (allowedEmails.includes(email)) {
    redirect("/admin");
  }

  // 2. Organizasyona Bağlı Kullanıcılar (Patron, Yönetici, Kasiyer)
  if (orgId) {
    // DB'den organizasyonun aktiflik durumunu kontrol et
    const dbOrg = await db.select().from(organizations).where(eq(organizations.id, orgId)).get();
    
    if (dbOrg && !dbOrg.isActive) {
      redirect("/org-disabled");
    }

    if (orgRole === "org:admin") {
      redirect("/boss-dashboard");
    }

    const meta = (user.publicMetadata || {}) as Record<string, unknown>;
    if (meta.role === "manager") {
      redirect("/manager-dashboard");
    }

    // Default: kasiyer
    redirect("/cashier-dashboard");
  }

  // 3. Organizasyonsuz Kullanıcılar
  const meta = (user.publicMetadata || {}) as Record<string, unknown>;

  // Davet edilmiş Patron mu?
  if (meta.role === "boss") {
    redirect("/create-organization");
  }

  // Eğer hiçbir yetkisi yoksa ve organizasyona bağlı değilse: IZINSIZ GIRIŞ
  // Kritik güvenlik uyarısı: Bu kullanıcı davetsiz gelmiştir.
  redirect("/unauthorized");
}
