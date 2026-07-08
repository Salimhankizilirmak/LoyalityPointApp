import { getOrgMembers } from "../actions";
import { BossTeamClient } from "./client-page";
import { checkLayoutGuard } from "@/lib/layout-guard";

export const dynamic = "force-dynamic";

export default async function BossTeamPage() {
  await checkLayoutGuard();
  
  let members: any[] = [];
  try {
    members = await getOrgMembers();
  } catch (err) {
    console.error("Boss team get members error:", err);
  }

  return <BossTeamClient initialMembers={members} />;
}
