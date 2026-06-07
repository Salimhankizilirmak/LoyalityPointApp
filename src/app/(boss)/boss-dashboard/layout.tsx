import { checkLayoutGuard } from "@/lib/layout-guard";
import { resolveActiveBranchContext } from "@/lib/branch-context";
import { BossLayoutClient } from "./layout-client";
import { ReactNode } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export const dynamic = "force-dynamic";

interface BossLayoutProps {
  children: ReactNode;
}

/**
 * Server Component layout – Aktif şube bağlamını sunucu tarafında çözer.
 * Kural 2: Tek şube varsa BranchSelector render edilmez, çerez sunucu tarafında peşin mühürlenir.
 * Mimari: UsernameWarningBanner → onActionClick → modal (settingsUrl Link kaldırıldı).
 */
export default async function BossLayout({ children }: BossLayoutProps) {
  let dbUser = null;
  try {
    dbUser = await checkLayoutGuard();
  } catch (error) {
    if (isRedirectError(error)) throw error; // 👑 Next.js yönlendirmelerini serbest bırak
    console.error("[BossLayout] Layout guard validation failed:", error);
  }

  const ctx = await resolveActiveBranchContext();

  return (
    <BossLayoutClient
      isMultiBranch={ctx?.isMultiBranch}
      activeBranchId={ctx?.activeBranchId}
      allBranches={ctx?.allBranches}
    >
      {children}
    </BossLayoutClient>
  );
}
