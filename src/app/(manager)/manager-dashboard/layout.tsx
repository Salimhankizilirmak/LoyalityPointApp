import { checkLayoutGuard } from "@/lib/layout-guard";
import { resolveActiveBranchContext } from "@/lib/branch-context";
import { db } from "@/db";
import { organizations, branches, staffProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
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
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    if (error && error.digest === "DYNAMIC_SERVER_USAGE") throw error;
    console.error("[ManagerLayout] Layout guard validation failed:", error);
  }

  const ctx = await resolveActiveBranchContext();

  let registrationCode = null;
  if (dbUser?.id && ctx?.activeBranchId) {
    try {
      const branch = await db.select({ orgId: branches.orgId }).from(branches).where(eq(branches.id, ctx.activeBranchId)).get();
      if (branch?.orgId) {
        const org = await db.select({ registrationCode: organizations.registrationCode })
          .from(organizations)
          .where(eq(organizations.id, branch.orgId))
          .get();
        registrationCode = org?.registrationCode || null;
      }
    } catch (e) {
      console.error("Fetch org registrationCode error:", e);
    }
  }

  return (
    <ManagerLayoutClient
      isMultiBranch={ctx?.isMultiBranch}
      activeBranchId={ctx?.activeBranchId}
      allBranches={ctx?.allBranches}
      registrationCode={registrationCode}
    >
      {children}
    </ManagerLayoutClient>
  );
}
