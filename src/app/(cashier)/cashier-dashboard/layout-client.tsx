"use client";

import { useState, ReactNode } from "react";
import { BranchSelector, type BranchOption } from "@/components/ui/BranchSelector";

import { ProfileSettingsModal } from "@/components/features/profile-settings/ui/ProfileSettingsModal";

interface CashierLayoutClientProps {
  children: ReactNode;
  isMultiBranch?: boolean;
  activeBranchId?: string | null;
  allBranches?: BranchOption[];
}

export function CashierLayoutClient({
  children,
  isMultiBranch,
  activeBranchId,
  allBranches,
}: CashierLayoutClientProps) {
  const [showProfileSettings, setShowProfileSettings] = useState(false);

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

      {children}
      <ProfileSettingsModal
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
        isDarkMode={true}
      />
    </div>
  );
}
