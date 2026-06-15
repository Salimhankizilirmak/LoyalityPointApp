import { checkLayoutGuard } from "@/lib/layout-guard";
import { db } from "@/db";
import { staffProfiles, branches } from "@/db/schema";
import { eq } from "drizzle-orm";
import CashierDashboardPage from "./client-page";
import { getBranchStatus } from "./actions";

export const dynamic = "force-dynamic";

async function safeFetch<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    console.error("[CashierDashboard Server Sync Error]:", error);
    return null;
  }
}

export default async function Page() {
  const dbUser = await checkLayoutGuard();
  
  let branchName = "Atanmamış Şube";
  if (dbUser) {
    const profile = await db
      .select()
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, dbUser.id))
      .get();
      
    if (profile && profile.branchId) {
      const branch = await db
        .select()
        .from(branches)
        .where(eq(branches.id, profile.branchId))
        .get();
      if (branch) {
        branchName = branch.name;
      }
    }
  }

  const branchStatusRes = await safeFetch(getBranchStatus());

  return (
    <CashierDashboardPage
      dbUser={{
        name: dbUser?.name || "Kasiyer",
        email: dbUser?.email || "",
        branchName,
      }}
      initialBranchStatus={branchStatusRes}
    />
  );
}
