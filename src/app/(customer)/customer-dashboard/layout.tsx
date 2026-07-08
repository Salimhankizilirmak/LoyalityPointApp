import { checkLayoutGuard } from "@/lib/layout-guard";
import { CustomerLayoutClient } from "@/components/features/customer-dashboard/ui/CustomerLayoutClient";
import { ReactNode } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { currentUser } from "@clerk/nextjs/server";

interface CustomerLayoutProps {
  children: ReactNode;
}

export default async function CustomerLayout({ children }: CustomerLayoutProps) {
  let dbUser = null;
  try {
    dbUser = await checkLayoutGuard();
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    if (error && error.digest === "DYNAMIC_SERVER_USAGE") throw error;
    console.error("[CustomerLayout] Layout guard validation failed:", error);
  }

  // 1. Giriş yapmış kullanıcının ad-soyad bilgisini Clerk server fonksiyonuyla çöz
  const user = await currentUser();
  const userFullName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : null;

  // 2. Genişletilen CustomerLayoutClient bileşenine required prop'ları hatasız geçir
  return (
    <CustomerLayoutClient 
      isAuthLoading={false}
      userFullName={userFullName}
    >
      {children}
    </CustomerLayoutClient>
  );
}
