import { checkLayoutGuard } from "@/lib/layout-guard";
import { resolveActiveBranchContext } from "@/lib/branch-context";
import { ManagerLayoutClient } from "./layout-client";
import { ReactNode } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export const dynamic = "force-dynamic";

interface ManagerLayoutProps {
  children: ReactNode;
}

export default async function ManagerLayout({ children }: ManagerLayoutProps) {
  let dbUser = null;
  try {
    dbUser = await checkLayoutGuard();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[ManagerLayout] Layout guard validation failed:", error);
  }

  const ctx = await resolveActiveBranchContext();

  return (
    <ManagerLayoutClient
      isMultiBranch={ctx?.isMultiBranch}
      activeBranchId={ctx?.activeBranchId}
      allBranches={ctx?.allBranches}
    >
      {children}
    </ManagerLayoutClient>
  );
}
