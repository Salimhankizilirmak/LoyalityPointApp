import { checkLayoutGuard } from "@/lib/layout-guard";
import { CustomerLayoutClient } from "./layout-client";
import { ReactNode } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";

interface CustomerLayoutProps {
  children: ReactNode;
}

export default async function CustomerLayout({ children }: CustomerLayoutProps) {
  let dbUser = null;
  try {
    dbUser = await checkLayoutGuard();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[CustomerLayout] Layout guard validation failed:", error);
  }

  return (
    <CustomerLayoutClient username={dbUser?.username}>
      {children}
    </CustomerLayoutClient>
  );
}

