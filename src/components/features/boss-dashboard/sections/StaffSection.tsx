"use client";

import { StaffManagement } from "../ui/StaffManagement";
import { Employee } from "../types";

interface StaffSectionProps {
  displayEmployees: Employee[];
  isDarkMode: boolean;
  handleUpdateMember: (id: string, fName: string, lName: string) => Promise<void>;
  handleRemoveMember: (id: string) => Promise<void>;
  setReassigningEmployee: (employee: Employee | null) => void;
  setShowInvite: (show: boolean) => void;
  loadingId: string | null;
  hasNoUsername: boolean;
}

export function StaffSection({
  displayEmployees,
  isDarkMode,
  handleUpdateMember,
  handleRemoveMember,
  setReassigningEmployee,
  setShowInvite,
  loadingId,
  hasNoUsername
}: StaffSectionProps) {
  return (
    <StaffManagement
      employees={displayEmployees}
      isDarkMode={isDarkMode}
      onUpdate={handleUpdateMember}
      onRemove={handleRemoveMember}
      onReassign={setReassigningEmployee}
      onInvite={() => setShowInvite(true)}
      loadingId={loadingId}
      hasNoUsername={hasNoUsername}
    />
  );
}
