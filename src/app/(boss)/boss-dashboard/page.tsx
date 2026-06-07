"use client";

import { useClerk, useUser, useOrganization } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Components
import { DashboardLoadingScreen } from "@/components/dashboard/DashboardLoadingScreen";
import { BossHeader } from "@/components/features/boss-dashboard/ui/BossHeader";
import UsernameWarningBanner from "@/components/ui/UsernameWarningBanner";
import {
  OverviewSection,
  AllBranchesSection,
  StaffSection,
  CustomersSection,
  ProfileSection
} from "@/components/features/boss-dashboard/sections";
import { BossDashboardModals } from "@/components/features/boss-dashboard/modals/BossDashboardModals";

// Hooks
import { useBossDashboard } from "@/components/features/boss-dashboard/hooks/useBossDashboard";

export const dynamic = "force-dynamic";

const TABS = ["Genel Bakış", "Şubeler", "Çalışanlar", "Müşteriler", "Profil"];

export default function BossDashboard() {
  const renderTime = performance.now();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { organization } = useOrganization();

  const { state, actions } = useBossDashboard();
  const router = useRouter();
  const refreshedRef = useRef(false);

  // Fallback Revalidation Koordinatörü:
  // bossInfo geldi ama yerel DB gecikmeli senkronize oldu (webhook gecikmesi).
  // Fallback verisi tespit edilirse router.refresh() ile sunucu bileşenlerini yenile.
  useEffect(() => {
    if (
      !refreshedRef.current &&
      state.bossInfo &&
      state.bossInfo.currentBranches === 0 &&
      state.bossInfo.branchLimit === 3
    ) {
      const timer = setTimeout(() => {
        console.log("🔄 [TELEMETRİ] Fallback veri tespit edildi — router.refresh() tetikleniyor.");
        refreshedRef.current = true;
        router.refresh();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.bossInfo, router]);

  const isSigningOut = typeof window !== "undefined" && sessionStorage.getItem("signing_out") === "true";
  console.log(`📊 [TELEMETRİ] BossDashboard Render Tetiklendi. bossInfo var mı: ${!!state.bossInfo}, signing_out bayrağı: ${isSigningOut}`);

  if (!state.bossInfo && !isSigningOut) {
    console.log("⏳ [TELEMETRİ] BossDashboard: İlk yükleme ekranına (DashboardLoadingScreen) karar verildi.");
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

  const safeBossInfo = state.bossInfo || {
    orgName: "",
    name: "",
    email: "",
    branchLimit: 2,
    currentBranches: 0,
    username: null
  };

  console.log(`✨ [TELEMETRİ] BossDashboard: Ana Dashboard Gövdesi Render Ediliyor! Render süresi: ${(performance.now() - renderTime).toFixed(2)}ms`);

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 font-sans ${state.isDarkMode ? "bg-[#0f172a] text-white" : "bg-slate-50 text-slate-900"}`}>
      {state.error && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] px-6 py-3 bg-rose-500 text-white rounded-xl shadow-lg font-medium text-sm animate-in fade-in slide-in-from-top-4">⚠️ {state.error}</div>}
      <BossHeader
        user={user}
        orgName={safeBossInfo.orgName}
        activeOrgId={state.activeOrgId}
        allOrgs={state.allOrgs}
        onSelectOrg={actions.handleSelectOrg}
        showMockData={state.showMockData}
        setShowMockData={actions.setShowMockData}
        isDarkMode={state.isDarkMode}
        setIsDarkMode={actions.setIsDarkMode}
        activeTab={state.activeTab}
        setActiveTab={actions.setActiveTab}
        signOut={() => actions.setShowSignOutOverlay(true)}
        tabs={TABS}
      />
      <UsernameWarningBanner
        username={safeBossInfo.username}
        onActionClick={() => actions.setShowProfileModal(true)}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {state.activeTab === 0 && <OverviewSection bossInfo={safeBossInfo} realBranchesCount={state.realBranchesCount} activeBranchesCount={state.activeBranchesCount} totalEarned={state.totalEarned} totalSpent={state.totalSpent} displayEmployees={state.displayEmployees} displayBranches={state.displayBranches} setActiveTab={actions.setActiveTab} isQuotaLimitReached={state.isQuotaLimitReached} hasNoUsername={state.hasNoUsername} handleDeleteBranch={actions.handleDeleteBranch} handleToggleBranchStatus={actions.handleToggleBranchStatus} setEditingBranch={actions.setEditingBranch} setShowAddBranch={actions.setShowAddBranch} setError={actions.setError} />}
        {state.activeTab === 1 && <AllBranchesSection isQuotaLimitReached={state.isQuotaLimitReached} realBranchesCount={state.realBranchesCount} bossInfo={safeBossInfo} hasNoUsername={state.hasNoUsername} displayBranches={state.displayBranches} handleDeleteBranch={actions.handleDeleteBranch} handleToggleBranchStatus={actions.handleToggleBranchStatus} setEditingBranch={actions.setEditingBranch} setShowAddBranch={actions.setShowAddBranch} setError={actions.setError} />}
        {state.activeTab === 2 && <StaffSection displayEmployees={state.displayEmployees} isDarkMode={state.isDarkMode} handleUpdateMember={actions.handleUpdateMember} handleRemoveMember={actions.handleRemoveMember} setReassigningEmployee={actions.setReassigningEmployee} setShowInvite={actions.setShowInvite} loadingId={state.loadingId} hasNoUsername={state.hasNoUsername} invitations={state.invitations} />}
        {state.activeTab === 3 && <CustomersSection displayCustomers={state.displayCustomers} isDarkMode={state.isDarkMode} handleAddCustomer={actions.handleAddCustomer} />}
        {state.activeTab === 4 && (
          <ProfileSection
            pointRate={state.pointRate}
            validityMonths={state.validityMonths}
            bossName={safeBossInfo.name}
            orgName={safeBossInfo.orgName}
            isDarkMode={state.isDarkMode}
            handleSaveSettings={actions.handleSaveSettings}
            handleUpdateMember={actions.handleUpdateMember}
            userId={user?.id}
            savingSettings={state.savingSettings}
            settingsSaved={state.settingsSaved}
          />
        )}
      </main>
      <BossDashboardModals
        showInvite={state.showInvite}
        setShowInvite={actions.setShowInvite}
        showAddBranch={state.showAddBranch}
        setShowAddBranch={actions.setShowAddBranch}
        editingBranch={state.editingBranch}
        setEditingBranch={actions.setEditingBranch}
        reassigningEmployee={state.reassigningEmployee}
        setReassigningEmployee={actions.setReassigningEmployee}
        showSignOutOverlay={state.showSignOutOverlay}
        showProfileModal={state.showProfileModal}
        setShowProfileModal={actions.setShowProfileModal}
        isDeleting={state.isDeleting}
        deleteType={state.deleteType}
        isTogglingStatus={state.isTogglingStatus}
        toggleAction={state.toggleAction}
        displayBranches={state.displayBranches}
        managers={state.managers}
        isDarkMode={state.isDarkMode}
        bossInfo={state.bossInfo}
        pointRate={state.pointRate}
        validityMonths={state.validityMonths}
        savingSettings={state.savingSettings}
        settingsSaved={state.settingsSaved}
        handleCreateBranch={actions.handleCreateBranch}
        handleChangeManager={actions.handleChangeManager}
        handleReassignMember={actions.handleReassignMember}
        handleSaveSettings={actions.handleSaveSettings}
        handleUpdateMember={actions.handleUpdateMember}
        userId={user?.id}
        refreshData={actions.refreshData}
        signOut={signOut}
      />
    </div>
  );
}
