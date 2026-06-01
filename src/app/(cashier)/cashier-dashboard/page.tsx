import { checkLayoutGuard } from "@/lib/layout-guard";
import { db } from "@/db";
import { staffProfiles, branches } from "@/db/schema";
import { eq } from "drizzle-orm";
import CashierDashboardPage from "./client-page";

export const dynamic = "force-dynamic";

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

  return (
    <CashierDashboardPage
      dbUser={{
        name: dbUser?.name || "Kasiyer",
        email: dbUser?.email || "",
        branchName,
      }}
    />
  );
}
