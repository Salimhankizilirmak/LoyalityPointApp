import { checkLayoutGuard } from "@/lib/layout-guard";
import { resolveActiveBranchContext } from "@/lib/branch-context";
import { CashierLayoutClient } from "./layout-client";
import { ReactNode } from "react";
import { db } from "@/db";
import { qrCustomerRequests, staffProfiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    if (error && error.digest === "DYNAMIC_SERVER_USAGE") throw error;
    console.error("[CashierLayout] Layout guard validation failed:", error);
  }

  const ctx = await resolveActiveBranchContext();

  let pendingCount = 0;
  if (dbUser && ctx?.activeBranchId) {
    try {
      const { branches } = await import("@/db/schema");
      const branch = await db.select({ orgId: branches.orgId }).from(branches).where(eq(branches.id, ctx.activeBranchId)).get();
      if (branch?.orgId) {
        const result = await db.select({ id: qrCustomerRequests.id })
          .from(qrCustomerRequests)
          .where(and(
            eq(qrCustomerRequests.branchId, ctx.activeBranchId),
            eq(qrCustomerRequests.status, "PENDING")
          )).all();
        pendingCount = result.length;
      }
    } catch (e) {
      console.error("Pending approvals fetch error:", e);
    }
  }

  return (
    <CashierLayoutClient
      isMultiBranch={ctx?.isMultiBranch}
      activeBranchId={ctx?.activeBranchId}
      allBranches={ctx?.allBranches}
      pendingCount={pendingCount}
    >
      {children}
    </CashierLayoutClient>
  );
}
