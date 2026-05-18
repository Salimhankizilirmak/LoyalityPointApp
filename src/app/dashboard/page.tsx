import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDashboardRedirectPath } from "@/lib/auth-utils";
import { checkLayoutGuard } from "@/lib/layout-guard";

export default async function DashboardRedirect() {
  await checkLayoutGuard();
  
  const { userId, orgId, orgRole } = await auth();

  if (!userId) {
    console.log("[DashboardRedirect] No userId, redirecting to /");
    redirect("/");
  }

  const targetPath = await getDashboardRedirectPath(userId, orgId, orgRole);
  redirect(targetPath);
}
