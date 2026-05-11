import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDashboardRedirectPath } from "@/lib/auth-utils";

export default async function DashboardRedirect() {
  const { userId, orgId, orgRole } = await auth();

  if (!userId) {
    console.log("[DashboardRedirect] No userId, redirecting to /");
    redirect("/");
  }

  const targetPath = await getDashboardRedirectPath(userId, orgId, orgRole);
  redirect(targetPath);
}
