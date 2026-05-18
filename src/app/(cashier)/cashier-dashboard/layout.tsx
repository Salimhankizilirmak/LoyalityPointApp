import { resolveActiveBranchContext } from "@/lib/branch-context";
import { BranchSelector } from "@/components/ui/BranchSelector";
import { ReactNode } from "react";

interface CashierLayoutProps {
  children: ReactNode;
}

/**
 * Server Component layout – Aktif şube bağlamını sunucu tarafında çözer.
 * Kural 2: Tek şube varsa BranchSelector render edilmez, çerez sunucu tarafında peşin mühürlenir.
 */
export default async function CashierLayout({ children }: CashierLayoutProps) {
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
      {children}
    </div>
  );
}
