import { getBranches } from "../actions";
import { InviteManagerClient } from "./invite-manager-client";

export const dynamic = "force-dynamic";

export default async function InviteManagerPage() {
  let branches: any[] = [];
  try {
    branches = await getBranches();
  } catch (error) {
    console.error("Failed to load branches:", error);
  }

  return (
    <InviteManagerClient branches={branches || []} />
  );
}
