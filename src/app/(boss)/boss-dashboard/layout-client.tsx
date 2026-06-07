"use client";

import { ReactNode } from "react";
import { BranchSelector } from "@/components/ui/BranchSelector";
import { type BranchOption } from "@/lib/branch-context";

interface BossLayoutClientProps {
  children: ReactNode;
  isMultiBranch?: boolean;
  activeBranchId?: string | null;
  allBranches?: BranchOption[];
}

export function BossLayoutClient({
  children,
  isMultiBranch,
  activeBranchId,
  allBranches,
}: BossLayoutClientProps) {
  return (
    <div className="relative min-h-screen">
      {isMultiBranch && activeBranchId && allBranches && (
        <div className="fixed top-3 right-4 z-50">
          <BranchSelector
            activeBranchId={activeBranchId}
            branches={allBranches}
          />
        </div>
      )}
      {children}
    </div>
  );
}
