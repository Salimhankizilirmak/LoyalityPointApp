import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
  const { userId, orgId, orgRole, sessionClaims } = await auth();

  if (!userId) {
    redirect("/");
  }

  // 1. Süper Admin Kontrolü
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  
  const envEmails = process.env.SUPER_ADMIN_EMAILS || "";
  const allowedEmails = envEmails.split(",").map(e => e.trim().toLowerCase());

  if (allowedEmails.includes(email)) {
    redirect("/admin");
  }
  // 2. Organizasyona Bağlı Kullanıcılar (Patron, Yönetici, Çalışan)
  if (orgId) {
    if (orgRole === "org:admin") {
      redirect("/boss-dashboard");
    } else if (orgRole === "org:manager") {
      // Not: "org:manager" rolünün Clerk Dashboard'dan oluşturulması gerekir.
      redirect("/manager-dashboard");
    } else {
      // Kasiyer / Normal Çalışan ("org:member")
      redirect("/cashier-dashboard");
    }
  }

  // 3. Organizasyonsuz Kullanıcılar (Müşteriler)
  redirect("/customer-dashboard");
}
