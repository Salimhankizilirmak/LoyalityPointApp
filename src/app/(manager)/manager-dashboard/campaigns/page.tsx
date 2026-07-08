import { CampaignsClient } from "./client-page";
import { checkLayoutGuard } from "@/lib/layout-guard";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  await checkLayoutGuard();
  
  return (
    <CampaignsClient />
  );
}
