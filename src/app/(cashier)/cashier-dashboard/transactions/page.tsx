import { checkLayoutGuard } from "@/lib/layout-guard";
import { resolveActiveBranchContext } from "@/lib/branch-context";
import { TransactionsClientPage } from "./transactions-client";

export const dynamic = "force-dynamic";

export default async function CashierTransactionsPage() {
  const dbUser = await checkLayoutGuard();
  const branchContext = await resolveActiveBranchContext();

  const cashierInfo = {
    name: dbUser.name || dbUser.email.split("@")[0],
    email: dbUser.email,
    branchName: branchContext?.activeBranchId
      ? branchContext.allBranches.find(b => b.id === branchContext.activeBranchId)?.name || "Atanmamış Şube"
      : "Atanmamış Şube"
  };

  return <TransactionsClientPage cashierInfo={cashierInfo} />;
}
