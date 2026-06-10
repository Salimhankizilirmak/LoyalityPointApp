import { checkLayoutGuard } from "@/lib/layout-guard";
import { TransactionsClientPage } from "./transactions-client";
import { db } from "@/db";
import { staffProfiles, branches } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function CashierTransactionsPage() {
  const dbUser = await checkLayoutGuard();

  // Kasiyerin veritabanındaki profilinden atandığı gerçek şubeyi sorgula
  const staffProfile = await db
    .select({
      branchName: branches.name,
    })
    .from(staffProfiles)
    .innerJoin(branches, eq(staffProfiles.branchId, branches.id))
    .where(eq(staffProfiles.userId, dbUser.id))
    .get();

  const cashierInfo = {
    name: dbUser.name || dbUser.email.split("@")[0],
    email: dbUser.email,
    branchName: staffProfile?.branchName || "Atanmamış Şube",
  };

  return <TransactionsClientPage cashierInfo={cashierInfo} />;
}
