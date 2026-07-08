import { StoreManagementClient } from "./client-page";
import { getManagerProfile, getStoreSettingsAction } from "../actions";
import { getBranchEarnRatioAction } from "../campaign-actions";
import { checkLayoutGuard } from "@/lib/layout-guard";

export const dynamic = "force-dynamic";

async function safeFetch<T>(promise: Promise<T>): Promise<T | null> {
  try { return await promise; } catch (error) { return null; }
}

export default async function StoreManagementPage() {
  await checkLayoutGuard();
  
  const [profile, settings, rateRes] = await Promise.all([
    safeFetch(getManagerProfile()),
    safeFetch(getStoreSettingsAction()),
    safeFetch(getBranchEarnRatioAction())
  ]);

  return (
    <StoreManagementClient 
      initialData={{ profile, settings, earnRatio: rateRes?.earnRatio ?? 10 }}
    />
  );
}
