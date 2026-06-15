import { getBossProfile, getBranches, getOrgMembers, getTopCustomersAction } from "./actions";
import { getInvitationsAction } from "@/app/actions/invitation-actions";
import { BossDashboardClient } from "./client-page";
import { checkLayoutGuard } from "@/lib/layout-guard";

export const dynamic = "force-dynamic";

async function safeFetch<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    console.error("[BossDashboard Server Sync Error]:", error);
    return null;
  }
}

export default async function Page() {
  await checkLayoutGuard();

  const [profile, members, branchesList, topCustomers, invitations] = await Promise.all([
    safeFetch(getBossProfile()),
    safeFetch(getOrgMembers()),
    safeFetch(getBranches()),
    safeFetch(getTopCustomersAction()),
    safeFetch(getInvitationsAction())
  ]);

  return (
    <BossDashboardClient
      initialData={{
        profile,
        members,
        branchesList,
        topCustomers,
        invitations
      }}
    />
  );
}
