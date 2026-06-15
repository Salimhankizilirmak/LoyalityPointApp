import { auth, currentUser } from "@clerk/nextjs/server";
import { ManagerDashboardClient } from "./client-page";
import { getManagerProfile, getBranchTransactions, getCustomers, getOrgMembers } from "./actions";
import { getInvitationsAction } from "@/app/actions/invitation-actions";
import { checkLayoutGuard } from "@/lib/layout-guard";

export const dynamic = "force-dynamic";

interface CustomJwtPayload {
  fullName?: string;
  metadata?: {
    branchName?: string;
  };
  publicMetadata?: {
    branchName?: string;
  };
}

async function safeFetch<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    console.error("[ManagerDashboard Server Sync Error]:", error);
    return null;
  }
}

export default async function ManagerDashboardPage() {
  await checkLayoutGuard();

  const { sessionClaims } = await auth();
  const user = await currentUser();

  const claims = sessionClaims as unknown as CustomJwtPayload;
  const branchName = claims?.metadata?.branchName || claims?.publicMetadata?.branchName || "";
  const managerName = user 
    ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.emailAddresses[0].emailAddress.split("@")[0]) 
    : (claims?.fullName || "Yönetici");

  const [profile, txs, invitesList, custs, emps] = await Promise.all([
    safeFetch(getManagerProfile()),
    safeFetch(getBranchTransactions()),
    safeFetch(getInvitationsAction()),
    safeFetch(getCustomers("")),
    safeFetch(getOrgMembers())
  ]);

  return (
    <ManagerDashboardClient 
      initialManagerName={managerName}
      initialBranchName={branchName}
      initialData={{
        profile,
        transactions: txs,
        invitations: invitesList,
        customers: custs,
        members: emps
      }}
    />
  );
}

