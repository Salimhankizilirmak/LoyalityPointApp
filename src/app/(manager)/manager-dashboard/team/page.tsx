import { TeamClient } from "./client-page";
import { getManagerProfile, getOrgMembers } from "../actions";
import { getInvitationsAction } from "@/app/actions/invitation-actions";
import { checkLayoutGuard } from "@/lib/layout-guard";

export const dynamic = "force-dynamic";

async function safeFetch<T>(promise: Promise<T>): Promise<T | null> {
  try { return await promise; } catch (error) { return null; }
}

export default async function TeamPage() {
  await checkLayoutGuard();
  
  const [profile, emps, invitesList] = await Promise.all([
    safeFetch(getManagerProfile()),
    safeFetch(getOrgMembers()),
    safeFetch(getInvitationsAction())
  ]);

  return (
    <TeamClient 
      initialData={{ profile, members: emps, invitations: invitesList }}
    />
  );
}
