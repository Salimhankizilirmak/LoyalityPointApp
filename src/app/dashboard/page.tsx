import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
  const { userId, orgId, orgRole, sessionClaims } = await auth();

  if (!userId) {
    redirect("/");
  }

  // 1. Süper Admin Kontrolü
  const metadataRole = (sessionClaims?.metadata as any)?.role;
  if (metadataRole === "superadmin") {
    redirect("/sys-core-admin-7f9a2b8c");
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
