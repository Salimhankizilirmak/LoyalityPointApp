import { auth, currentUser } from "@clerk/nextjs/server";
import { CustomersClient } from "./client-page";
import { getManagerProfile, getBranchTransactions, getCustomers } from "../actions";
import { getInvitationsAction } from "@/app/actions/invitation-actions";
import { checkLayoutGuard } from "@/lib/layout-guard";

export const dynamic = "force-dynamic";

async function safeFetch<T>(promise: Promise<T>): Promise<T | null> {
  try { return await promise; } catch (error) { return null; }
}

export default async function CustomersPage() {
  await checkLayoutGuard();
  const { sessionClaims } = await auth();
  const user = await currentUser();
  const claims = sessionClaims as any;
  const branchName = claims?.metadata?.branchName || claims?.publicMetadata?.branchName || "";
  const managerName = user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.emailAddresses[0].emailAddress.split("@")[0]) : "Yönetici";

  const [profile, txs, custs, invitesList] = await Promise.all([
    safeFetch(getManagerProfile()),
    safeFetch(getBranchTransactions()),
    safeFetch(getCustomers("")),
    safeFetch(getInvitationsAction())
  ]);

  return (
    <CustomersClient 
      initialManagerName={managerName}
      initialBranchName={branchName}
      initialData={{ profile, transactions: txs, customers: custs, invitations: invitesList || [] }}
    />
  );
}
