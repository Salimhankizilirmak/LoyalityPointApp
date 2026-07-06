import { getBossProfile, getBranches, getOrgMembers } from "../actions";
import { BranchesClient } from "./branches-client";

export const dynamic = "force-dynamic";

async function safeFetch<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    console.error("[Branches Server Fetch Error]:", error);
    return null;
  }
}

import { BossInfo, Branch, Employee } from "@/components/features/boss-dashboard/types";

export default async function BranchesPage() {
  const [profile, branches, members] = await Promise.all([
    safeFetch(getBossProfile()),
    safeFetch(getBranches()),
    safeFetch(getOrgMembers()),
  ]);

  const bossInfo: BossInfo | null = profile ? {
    name: `${profile.user.firstName || ''} ${profile.user.lastName || ''}`.trim() || profile.user.email,
    email: profile.user.email,
    orgName: profile.org?.name || 'Organizasyon',
    branchLimit: profile.org?.branchLimit || 2,
    currentBranches: profile.org?.currentBranches || 0,
    username: profile.user.username
  } : null;

  const mappedBranches: Branch[] = (branches || []).map((b: any) => ({
    id: b.id,
    name: b.name,
    city: b.city,
    manager: b.managerId || "",
    transactions: 0,
    earnedPts: 0,
    spentPts: 0,
    status: b.isActive ? "active" : "passive"
  }));

  const mappedMembers: Employee[] = (members || []).map((m: any) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role as "boss" | "manager" | "cashier",
    branch: m.branch,
    avatar: m.avatar,
    status: m.status === "suspended" ? "pending" : (m.status as "active" | "pending")
  }));

  return (
    <BranchesClient 
      profile={bossInfo} 
      branches={mappedBranches} 
      members={mappedMembers} 
    />
  );
}
