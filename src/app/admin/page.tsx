import { getAllOrganizations, getInvitedBosses } from "./actions";
import { SuperAdminDashboardClient } from "./client-page";
import { checkLayoutGuard } from "@/lib/layout-guard";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Süper Admin Paneli | Sadakat Puan Sistemi",
  description: "Sistem organizasyonlarını ve patron davetlerini yönetin.",
};

async function safeFetch<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    console.error("[SuperAdminDashboard Server Sync Error]:", error);
    return null;
  }
}

export default async function SuperAdminDashboardPage() {
  await checkLayoutGuard();

  const [orgsData, bossesData] = await Promise.all([
    safeFetch(getAllOrganizations()),
    safeFetch(getInvitedBosses())
  ]);

  return (
    <SuperAdminDashboardClient
      initialOrgsData={orgsData || []}
      initialBossesData={bossesData || []}
    />
  );
}
