import { checkLayoutGuard } from "@/lib/layout-guard";
import { resolveActiveBranchContext } from "@/lib/branch-context";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
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
  } catch (error: any) {
    if (isRedirectError(error)) throw error; // 👑 Next.js yönlendirmelerini serbest bırak
    if (error && error.digest === "DYNAMIC_SERVER_USAGE") throw error;
    console.error("[BossLayout] Layout guard validation failed:", error);
  }

  const ctx = await resolveActiveBranchContext();

  let registrationCode = null;
  if (dbUser?.id) {
    try {
      const org = await db.select({ registrationCode: organizations.registrationCode })
        .from(organizations)
        .where(eq(organizations.bossId, dbUser.id))
        .get();
      registrationCode = org?.registrationCode || null;
    } catch (e) {
      console.error("Fetch org registrationCode error:", e);
    }
  }

  return (
    <BossLayoutClient
      isMultiBranch={ctx?.isMultiBranch}
      activeBranchId={ctx?.activeBranchId}
      allBranches={ctx?.allBranches}
      registrationCode={registrationCode}
    >
      {children}
    </BossLayoutClient>
  );
}
