"use client";
// UX Audit: placeholder

import { Branch, BossInfo, Employee, TopCustomer } from "../types";
import { QuotaProgressBar } from "./QuotaProgressBar";
// import { AnalyticsBanner } from "./AnalyticsBanner";
import { BossOverviewStats } from "../ui/BossOverviewStats";
import { LeaderboardCards } from "../ui/LeaderboardCards";
import { BranchPerformanceSection } from "./BranchPerformanceSection";


interface OverviewSectionProps {
  bossInfo: BossInfo;
  realBranchesCount: number;
  activeBranchesCount: number;
  totalEarned: number;
  totalSpent: number;
  displayEmployees: Employee[];
  displayBranches: Branch[];
  setActiveTab: (tab: number) => void;
  isQuotaLimitReached: boolean;
  hasNoUsername: boolean;
  handleDeleteBranch: (id: string) => Promise<void>;
  handleToggleBranchStatus: (id: string) => Promise<void>;
  setEditingBranch: (branch: Branch | null) => void;
  setShowAddBranch: (show: boolean) => void;
  setError: (error: string | null) => void;
  topCustomers: TopCustomer[];
}

export function OverviewSection({
  bossInfo,
  realBranchesCount,
  activeBranchesCount,
  totalEarned,
  totalSpent,
  displayEmployees,
  displayBranches,
  setActiveTab,
  isQuotaLimitReached,
  hasNoUsername,
  handleDeleteBranch,
  handleToggleBranchStatus,
  setEditingBranch,
  setShowAddBranch,
  setError,
  topCustomers
}: OverviewSectionProps) {
  return (
    <div className="space-y-8">
      <QuotaProgressBar bossInfo={bossInfo} realBranchesCount={realBranchesCount} />
      {/* <AnalyticsBanner /> */}
      <BossOverviewStats
        activeBranches={activeBranchesCount}
        totalEarned={totalEarned}
        totalSpent={totalSpent}
        employeeCount={displayEmployees.length}
      />
      <LeaderboardCards
        topCustomers={topCustomers}
        topBranches={displayBranches}
        onViewAllCustomers={() => setActiveTab(3)}
        onViewAllBranches={() => setActiveTab(1)}
      />
      <BranchPerformanceSection
        isQuotaLimitReached={isQuotaLimitReached}
        realBranchesCount={realBranchesCount}
        branchLimit={bossInfo.branchLimit || 2}
        hasNoUsername={hasNoUsername}
        displayBranches={displayBranches}
        handleDeleteBranch={handleDeleteBranch}
        handleToggleBranchStatus={handleToggleBranchStatus}
        setEditingBranch={setEditingBranch}
        setShowAddBranch={setShowAddBranch}
        setError={setError}
      />
    </div>
  );
}
