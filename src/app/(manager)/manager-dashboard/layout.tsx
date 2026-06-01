import { checkLayoutGuard } from "@/lib/layout-guard";
import { resolveActiveBranchContext } from "@/lib/branch-context";
import { BranchSelector } from "@/components/ui/BranchSelector";
import UsernameWarningBanner from "@/components/ui/UsernameWarningBanner";
import { ReactNode } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";

interface ManagerLayoutProps {
  children: ReactNode;
}

/**
 * Server Component layout – Aktif şube bağlamını sunucu tarafında çözer.
 * Kural 2: Tek şube varsa BranchSelector render edilmez, çerez sunucu tarafında peşin mühürlenir.
 */
export default async function ManagerLayout({ children }: ManagerLayoutProps) {
  let dbUser = null;
  try {
    dbUser = await checkLayoutGuard();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[ManagerLayout] Layout guard validation failed:", error);
  }

  const ctx = await resolveActiveBranchContext();

  return (
    <div className="relative min-h-screen">
      {/* Branch Selector – sadece çoklu şube varsa göster */}
      {ctx && ctx.isMultiBranch && (
        <div className="fixed top-3 right-4 z-50">
          <BranchSelector
            activeBranchId={ctx.activeBranchId}
            branches={ctx.allBranches}
          />
        </div>
      )}
      <UsernameWarningBanner username={dbUser?.username} settingsUrl="/manager-dashboard/settings" />
      {children}
    </div>
  );
}
