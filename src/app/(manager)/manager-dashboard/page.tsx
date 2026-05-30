import { auth, currentUser } from "@clerk/nextjs/server";
import { ManagerDashboardClient } from "./client-page";

export const dynamic = "force-dynamic";

interface CustomJwtPayload {
  fullName?: string;
  metadata?: {
    branchName?: string;
  };
  publicMetadata?: {
    branchName?: string;
  };
}

export default async function ManagerDashboardPage() {
  const { sessionClaims } = await auth();
  const user = await currentUser();

  const claims = sessionClaims as unknown as CustomJwtPayload;
  const branchName = claims?.metadata?.branchName || claims?.publicMetadata?.branchName || "";
  const managerName = user 
    ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.emailAddresses[0].emailAddress.split("@")[0]) 
    : (claims?.fullName || "Yönetici");

  return (
    <ManagerDashboardClient 
      initialManagerName={managerName}
      initialBranchName={branchName}
    />
  );
}

