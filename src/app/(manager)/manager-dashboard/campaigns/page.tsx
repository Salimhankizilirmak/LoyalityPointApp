import { CampaignsClient } from "./client-page";
import { getManagerProfile } from "../actions";
import { checkLayoutGuard } from "@/lib/layout-guard";

export const dynamic = "force-dynamic";

async function safeFetch<T>(promise: Promise<T>): Promise<T | null> {
  try { return await promise; } catch (error) { return null; }
}

export default async function CampaignsPage() {
  await checkLayoutGuard();
  
  const [profile] = await Promise.all([
    safeFetch(getManagerProfile())
  ]);

  return (
    <CampaignsClient 
      initialData={{ profile }}
    />
  );
}
