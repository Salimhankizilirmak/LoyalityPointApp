"use client";

import { useState, ReactNode } from "react";
import { BranchSelector, type BranchOption } from "@/components/ui/BranchSelector";
import UsernameWarningBanner from "@/components/ui/UsernameWarningBanner";
import { UsernameWarningModal } from "@/components/ui/UsernameWarningModal";
import { saveCashierUsernameAction } from "./actions";

interface CashierLayoutClientProps {
  children: ReactNode;
  username?: string | null;
  isMultiBranch?: boolean;
  activeBranchId?: string | null;
  allBranches?: BranchOption[];
}

export function CashierLayoutClient({
  children,
  username,
  isMultiBranch,
  activeBranchId,
  allBranches,
}: CashierLayoutClientProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      {isMultiBranch && activeBranchId && allBranches && (
        <div className="fixed top-3 right-4 z-50">
          <BranchSelector
            activeBranchId={activeBranchId}
            branches={allBranches}
          />
        </div>
      )}
      <UsernameWarningBanner
        username={username}
        onActionClick={() => setShowProfileModal(true)}
      />
      {children}
      <UsernameWarningModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        saveAction={saveCashierUsernameAction}
      />
    </div>
  );
}
