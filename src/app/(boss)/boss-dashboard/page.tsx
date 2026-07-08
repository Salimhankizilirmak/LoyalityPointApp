import { redirect } from "next/navigation";
import { checkLayoutGuard } from "@/lib/layout-guard";

export const dynamic = "force-dynamic";

export default async function Page() {
  await checkLayoutGuard();
  redirect("/boss-dashboard/analytics");
}
