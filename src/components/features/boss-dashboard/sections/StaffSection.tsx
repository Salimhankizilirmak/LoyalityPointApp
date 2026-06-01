"use client";

import { StaffManagement } from "../ui/StaffManagement";
import { Employee } from "../types";
import { InvitationsAuditFeed } from "@/components/features/invitations/ui/InvitationsAuditFeed";

interface InvitationItem {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date | number | null;
  branchName?: string | null;
}

interface StaffSectionProps {
  displayEmployees: Employee[];
  isDarkMode: boolean;
  handleUpdateMember: (id: string, fName: string, lName: string) => Promise<void>;
  handleRemoveMember: (id: string) => Promise<void>;
  setReassigningEmployee: (employee: Employee | null) => void;
  setShowInvite: (show: boolean) => void;
  loadingId: string | null;
  hasNoUsername: boolean;
  invitations: InvitationItem[];
}

export function StaffSection({
  displayEmployees,
  isDarkMode,
  handleUpdateMember,
  handleRemoveMember,
  setReassigningEmployee,
  setShowInvite,
  loadingId,
  hasNoUsername,
  invitations
}: StaffSectionProps) {
  return (
    <div className="space-y-6">
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
      <div className="mt-8">
        <InvitationsAuditFeed invitations={invitations} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}
