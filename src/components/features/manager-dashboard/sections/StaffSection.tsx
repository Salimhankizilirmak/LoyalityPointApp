"use client";

import { EmployeeManagement } from "../ui/EmployeeManagement";
import { Employee } from "../types";

interface StaffSectionProps {
  cashiers: Employee[];
  isDarkMode: boolean;
  handleUpdateCashier: (id: string, f: string, l: string) => Promise<void>;
  handleRemoveCashier: (id: string) => Promise<void>;
  handleToggleStatus: (id: string, isActive: boolean) => Promise<void>;
  setShowInvite: (show: boolean) => void;
  loadingId: string | null;
}

export function StaffSection({
  cashiers,
  isDarkMode,
  handleUpdateCashier,
  handleRemoveCashier,
  handleToggleStatus,
  setShowInvite,
  loadingId
}: StaffSectionProps) {
  return (
    <div className="glass-panel-elevated rounded-3xl p-8 transition-all">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-white">Ekip Yönetimi</h2>
        <button 
          onClick={() => setShowInvite(true)}
          className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold"
        >
          Kasiyer Davet Et
        </button>
      </div>
      <EmployeeManagement 
        employees={cashiers}
        isDarkMode={isDarkMode}
        onUpdate={handleUpdateCashier}
        onRemove={handleRemoveCashier}
        onToggleStatus={handleToggleStatus}
        loadingId={loadingId}
      />
    </div>
  );
}

