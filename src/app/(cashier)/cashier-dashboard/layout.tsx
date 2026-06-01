import { checkLayoutGuard } from "@/lib/layout-guard";
import { resolveActiveBranchContext } from "@/lib/branch-context";
import { CashierLayoutClient } from "./layout-client";
import { ReactNode } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";

interface CashierLayoutProps {
  children: ReactNode;
}

/**
 * Server Component layout – Aktif şube bağlamını sunucu tarafında çözer.
 * Kural 2: Tek şube varsa BranchSelector render edilmez, çerez sunucu tarafında peşin mühürlenir.
 */
export default async function CashierLayout({ children }: CashierLayoutProps) {
  let dbUser = null;
  try {
    dbUser = await checkLayoutGuard();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[CashierLayout] Layout guard validation failed:", error);
  }

  const ctx = await resolveActiveBranchContext();

  return (
    <CashierLayoutClient
      username={dbUser?.username}
      isMultiBranch={ctx?.isMultiBranch}
      activeBranchId={ctx?.activeBranchId}
      allBranches={ctx?.allBranches}
    >
      {children}
    </CashierLayoutClient>
  );
}
