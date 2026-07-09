"use client";

import { EmployeeManagement } from "../ui/EmployeeManagement";
import { Employee, Transaction } from "../types";

interface InvitationItem {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date | number | null;
  branchName?: string | null;
}

interface StaffSectionProps {
  cashiers: Employee[];
  transactions: Transaction[];
  isDarkMode: boolean;
  handleUpdateCashier: (id: string, f: string, l: string) => Promise<void>;
  handleRemoveCashier: (id: string) => Promise<void>;
  handleToggleStatus: (id: string, isActive: boolean) => Promise<void>;
  setShowInvite: (show: boolean) => void;
  loadingId: string | null;
  invitations: InvitationItem[];
  handleUpdateEmail?: (id: string, newEmail: string) => Promise<void>;
}

export function StaffSection({
  cashiers,
  transactions,
  isDarkMode,
  handleUpdateCashier,
  handleRemoveCashier,
  handleToggleStatus,
  setShowInvite,
  loadingId,
  invitations,
  handleUpdateEmail
}: StaffSectionProps) {
  
  return (
    <div className="space-y-6">
      <div className="glass-panel-elevated rounded-3xl p-4 sm:p-5 transition-all">
        <EmployeeManagement
          employees={cashiers}
          transactions={transactions}
          isDarkMode={isDarkMode}
          onUpdate={handleUpdateCashier}
          onRemove={handleRemoveCashier}
          onToggleStatus={handleToggleStatus}
          onUpdateEmail={handleUpdateEmail}
          loadingId={loadingId}
          onAddClick={() => setShowInvite(true)}
        />
      </div>
    </div>
  );
}

