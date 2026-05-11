import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardRedirect() {
  const { userId, orgId, orgRole } = await auth();
  console.log(`[DashboardRedirect] userId: ${userId}, orgId: ${orgId}, orgRole: ${orgRole}`);

  if (!userId) {
    console.log("[DashboardRedirect] No userId, redirecting to /");
    redirect("/");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  console.log(`[DashboardRedirect] User email: ${email}`);

  // 1. Süper Admin Kontrolü
  const envEmails = process.env.SUPER_ADMIN_EMAILS || "";
  const allowedEmails = envEmails
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(email => email !== ""); // Boş değerleri temizle

  console.log(`[DashboardRedirect] Checking if ${email} is in ${allowedEmails.join(", ")}`);

  if (allowedEmails.includes(email)) {
    console.log("[DashboardRedirect] Super Admin identified by email. Redirecting to /admin immediately.");
    redirect("/admin");
    return; // Redirection sonrası kodun devam etmesini engelle
  }

  // 2. Organizasyona Bağlı Kullanıcılar (Patron, Yönetici, Kasiyer)
  if (orgId) {
    console.log(`[DashboardRedirect] OrgId found: ${orgId}. Checking DB status...`);
    // DB'den organizasyonun aktiflik durumunu kontrol et
    const dbOrg = await db.select().from(organizations).where(eq(organizations.id, orgId)).get();
    
    if (dbOrg && !dbOrg.isActive) {
      console.log("[DashboardRedirect] Organization is inactive, redirecting to /org-disabled");
      redirect("/org-disabled");
    }

    if (orgRole === "org:admin") {
      console.log("[DashboardRedirect] Org:Admin detected, redirecting to /boss-dashboard");
      redirect("/boss-dashboard");
    }

    const meta = (user.publicMetadata || {}) as Record<string, unknown>;
    console.log(`[DashboardRedirect] Checking metadata role for org user: ${meta.role}`);
    
    if (meta.role === "manager") {
      console.log("[DashboardRedirect] Manager detected, redirecting to /manager-dashboard");
      redirect("/manager-dashboard");
    }

    // Default: kasiyer
    console.log("[DashboardRedirect] Falling back to cashier dashboard");
    redirect("/cashier-dashboard");
  }

  // 3. Organizasyonsuz Kullanıcılar
  const meta = (user.publicMetadata || {}) as Record<string, unknown>;
  console.log(`[DashboardRedirect] No OrgId. Metadata role: ${meta.role}`);

  // Davet edilmiş Patron mu?
  if (meta.role === "boss") {
    console.log("[DashboardRedirect] Invited Boss detected without org, redirecting to /create-organization");
    redirect("/create-organization");
  }

  // Eğer hiçbir yetkisi yoksa ve organizasyona bağlı değilse: IZINSIZ GIRIŞ
  console.log("[DashboardRedirect] No access, redirecting to /unauthorized");
  redirect("/unauthorized");
}
