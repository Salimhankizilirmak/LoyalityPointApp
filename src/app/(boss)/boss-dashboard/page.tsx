"use client";

import { useState, useEffect } from "react";
import { useClerk, useUser, useOrganization } from "@clerk/nextjs";

// Components
import { DashboardLoadingScreen } from "@/components/dashboard/DashboardLoadingScreen";
import { BossHeader } from "@/components/features/boss-dashboard/ui/BossHeader";
import {
  OverviewSection,
  AllBranchesSection,
  StaffSection,
  CustomersSection,
  ProfileSection
} from "@/components/features/boss-dashboard/sections";
import { BossDashboardModals } from "@/components/features/boss-dashboard/modals/BossDashboardModals";

// Hooks & Types
import { useBossDashboard } from "@/components/features/boss-dashboard/hooks/useBossDashboard";
import { Branch, Employee } from "@/components/features/boss-dashboard/types";

export const dynamic = "force-dynamic";

const TABS = ["Genel Bakış", "Şubeler", "Çalışanlar", "Müşteriler", "Profil"];

export default function BossDashboard() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { organization } = useOrganization();

  // Visibility states (for AnimatePresence exit animations)
  const [showInvite, setShowInvite] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [reassigningEmployee, setReassigningEmployee] = useState<Employee | null>(null);
  const [showSignOutOverlay, setShowSignOutOverlay] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteType, setDeleteType] = useState<"branch" | "staff">("branch");
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [toggleAction, setToggleAction] = useState<"activate" | "deactivate" | null>(null);

  const state = useBossDashboard({ setIsDeleting, setDeleteType, setIsTogglingStatus, setToggleAction, setShowAddBranch });

  const { error, setError } = state;

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  if (!state.bossInfo) {
    const displayName = user 
      ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.emailAddresses[0].emailAddress.split("@")[0]) 
      : null;
    return (
      <DashboardLoadingScreen
        userName={displayName}
        orgName={user?.publicMetadata?.orgName as string || null}
        logoUrl={organization?.imageUrl || null}
      />
    );
  }

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 font-sans ${state.isDarkMode ? "bg-[#0f172a] text-white" : "bg-slate-50 text-slate-900"}`}>
      {state.error && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] px-6 py-3 bg-rose-500 text-white rounded-xl shadow-lg font-medium text-sm animate-in fade-in slide-in-from-top-4">⚠️ {state.error}</div>}
      <BossHeader user={user} orgName={state.bossInfo.orgName} activeOrgId={state.activeOrgId} allOrgs={state.allOrgs} onSelectOrg={state.handleSelectOrg} showMockData={state.showMockData} setShowMockData={state.setShowMockData} isDarkMode={state.isDarkMode} setIsDarkMode={state.setIsDarkMode} activeTab={state.activeTab} setActiveTab={state.setActiveTab} signOut={() => setShowSignOutOverlay(true)} tabs={TABS} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {state.activeTab === 0 && <OverviewSection bossInfo={state.bossInfo} realBranchesCount={state.realBranchesCount} activeBranchesCount={state.activeBranchesCount} totalEarned={state.totalEarned} totalSpent={state.totalSpent} displayEmployees={state.displayEmployees} displayBranches={state.displayBranches} setActiveTab={state.setActiveTab} isQuotaLimitReached={state.isQuotaLimitReached} hasNoUsername={state.hasNoUsername} handleDeleteBranch={state.handleDeleteBranch} handleToggleBranchStatus={state.handleToggleBranchStatus} setEditingBranch={setEditingBranch} setShowAddBranch={setShowAddBranch} setError={state.setError} />}
        {state.activeTab === 1 && <AllBranchesSection isQuotaLimitReached={state.isQuotaLimitReached} realBranchesCount={state.realBranchesCount} bossInfo={state.bossInfo} hasNoUsername={state.hasNoUsername} displayBranches={state.displayBranches} handleDeleteBranch={state.handleDeleteBranch} handleToggleBranchStatus={state.handleToggleBranchStatus} setEditingBranch={setEditingBranch} setShowAddBranch={setShowAddBranch} setError={state.setError} />}
        {state.activeTab === 2 && <StaffSection displayEmployees={state.displayEmployees} isDarkMode={state.isDarkMode} handleUpdateMember={state.handleUpdateMember} handleRemoveMember={state.handleRemoveMember} setReassigningEmployee={setReassigningEmployee} setShowInvite={setShowInvite} loadingId={state.loadingId} hasNoUsername={state.hasNoUsername} invitations={state.invitations} />}
        {state.activeTab === 3 && <CustomersSection displayCustomers={state.displayCustomers} isDarkMode={state.isDarkMode} handleAddCustomer={state.handleAddCustomer} />}
        {state.activeTab === 4 && <ProfileSection pointRate={state.pointRate} validityMonths={state.validityMonths} bossName={state.bossInfo.name} orgName={state.bossInfo.orgName} isDarkMode={state.isDarkMode} handleSaveSettings={state.handleSaveSettings} handleUpdateMember={state.handleUpdateMember} userId={user?.id} savingSettings={state.savingSettings} settingsSaved={state.settingsSaved} />}
      </main>
      <BossDashboardModals showInvite={showInvite} setShowInvite={setShowInvite} showAddBranch={showAddBranch} setShowAddBranch={setShowAddBranch} editingBranch={editingBranch} setEditingBranch={setEditingBranch} reassigningEmployee={reassigningEmployee} setReassigningEmployee={setReassigningEmployee} showSignOutOverlay={showSignOutOverlay} isDeleting={isDeleting} deleteType={deleteType} isTogglingStatus={isTogglingStatus} toggleAction={toggleAction} displayBranches={state.displayBranches} managers={state.managers} isDarkMode={state.isDarkMode} handleCreateBranch={state.handleCreateBranch} handleChangeManager={state.handleChangeManager} handleReassignMember={state.handleReassignMember} refreshData={state.refreshData} signOut={signOut} />
    </div>
  );
}
