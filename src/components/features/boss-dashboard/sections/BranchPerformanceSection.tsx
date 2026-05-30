"use client";

import { Branch } from "../types";
import { QuotaLimitAlert } from "./QuotaLimitAlert";
import { BranchTable } from "../ui/BranchTable";

interface BranchPerformanceSectionProps {
  isQuotaLimitReached: boolean;
  realBranchesCount: number;
  branchLimit: number;
  hasNoUsername: boolean;
  displayBranches: Branch[];
  handleDeleteBranch: (id: string) => Promise<void>;
  handleToggleBranchStatus: (id: string) => Promise<void>;
  setEditingBranch: (branch: Branch | null) => void;
  setShowAddBranch: (show: boolean) => void;
  setError: (error: string | null) => void;
}

export function BranchPerformanceSection({
  isQuotaLimitReached,
  realBranchesCount,
  branchLimit,
  hasNoUsername,
  displayBranches,
  handleDeleteBranch,
  handleToggleBranchStatus,
  setEditingBranch,
  setShowAddBranch,
  setError
}: BranchPerformanceSectionProps) {
  return (
    <div className="glass-panel-elevated rounded-3xl p-8 transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h2 className="font-bold text-lg text-white">Şube Performans Detayları</h2>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
          {isQuotaLimitReached && (
            <QuotaLimitAlert
              realBranchesCount={realBranchesCount}
              branchLimit={branchLimit}
            />
          )}
          <div className="relative group/tooltip">
            <button
              onClick={() => {
                if (hasNoUsername) return;
                if (isQuotaLimitReached) {
                  setError("Şube oluşturma limitine ulaştınız. Daha fazla şube eklemek için lütfen yöneticinizle iletişime geçin.");
                  return;
                }
                setShowAddBranch(true);
              }}
              disabled={isQuotaLimitReached || hasNoUsername}
              className={`btn-primary px-6 py-3 rounded-xl text-sm font-bold transition-all shrink-0 ${(isQuotaLimitReached || hasNoUsername)
                ? "opacity-40 cursor-not-allowed bg-slate-800 border border-white/10 text-slate-500 hover:scale-100"
                : "hover:scale-[1.02] active:scale-[0.98]"
                }`}
            >
              Yeni Şube Ekle
            </button>
            {hasNoUsername && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50">
                Bu işlemi gerçekleştirmek için kullanıcı adı belirlemelisiniz.
              </div>
            )}
          </div>
        </div>
      </div>
      <BranchTable
        branches={displayBranches}
        onDelete={handleDeleteBranch}
        onToggleStatus={handleToggleBranchStatus}
        onChangeManager={setEditingBranch}
      />
    </div>
  );
}
