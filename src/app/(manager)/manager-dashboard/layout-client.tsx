"use client";

import { useState, ReactNode } from "react";
import { BranchSelector } from "@/components/ui/BranchSelector";
import { type BranchOption } from "@/lib/branch-context";

import { ProfileSettingsModal } from "@/components/features/profile-settings/ui/ProfileSettingsModal";

interface ManagerLayoutClientProps {
  children: ReactNode;
  isMultiBranch?: boolean;
  activeBranchId?: string | null;
  allBranches?: BranchOption[];
}

export function ManagerLayoutClient({
  children,
  isMultiBranch,
  activeBranchId,
  allBranches,
}: ManagerLayoutClientProps) {
  const [showProfileSettings, setShowProfileSettings] = useState(false);

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
      <ProfileSettingsModal
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
        isDarkMode={true}
      />
    </div>
  );
}
