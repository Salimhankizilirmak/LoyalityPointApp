import { auth, currentUser } from "@clerk/nextjs/server";
import { OverviewClient } from "./client-page";
import { getManagerProfile, getBranchTransactions, getOrgMembers, getRecentActivities } from "./actions";
import { getInvitationsAction } from "@/app/actions/invitation-actions";
import { getCampaignsAction } from "./campaign-actions";
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

  const [profile, txs, emps, invitesList, campaignsRes, activities] = await Promise.all([
    safeFetch(getManagerProfile()),
    safeFetch(getBranchTransactions()),
    safeFetch(getOrgMembers()),
    safeFetch(getInvitationsAction()),
    safeFetch(getCampaignsAction()),
    safeFetch(getRecentActivities()),
  ]);

  return (
    <OverviewClient 
      initialManagerName={managerName}
      initialBranchName={branchName}
      initialData={{
        profile,
        transactions: txs,
        members: emps,
        invitations: invitesList ?? [],
        campaigns: campaignsRes && typeof campaignsRes === 'object' && 'campaigns' in campaignsRes ? campaignsRes.campaigns : [],
        activities: activities ?? [],
      }}
    />
  );
}
