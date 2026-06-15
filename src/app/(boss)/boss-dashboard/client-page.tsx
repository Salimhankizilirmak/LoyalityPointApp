"use client";

import { useClerk, useUser, useOrganization } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Components

import { BossHeader } from "@/components/features/boss-dashboard/ui/BossHeader";
import {
  OverviewSection,
  AllBranchesSection,
  CustomersSection
} from "@/components/features/boss-dashboard/sections";
import { BossProfileSettings } from "@/components/features/boss-dashboard/ui/BossProfileSettings";
import { BossDashboardModals } from "@/components/features/boss-dashboard/modals/BossDashboardModals";

// Hooks
import { useBossDashboard } from "@/components/features/boss-dashboard/hooks/useBossDashboard";

const TABS = ["Genel Bakış", "Şubeler", "Müşteriler", "Mağaza Yönetimi"];

interface BossDashboardClientProps {
  initialData: any;
}

export function BossDashboardClient({ initialData }: BossDashboardClientProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const renderTime = performance.now();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { organization } = useOrganization();

  const dashboard = useBossDashboard(initialData);
  const originalSetActiveTab = dashboard.actions.setActiveTab;
  const setActiveTabWrapper = (tab: number | string) => {
    if (tab === "profile") {
      originalSetActiveTab(3);
    } else {
      originalSetActiveTab(Number(tab));
    }
  };
  const actions = {
    ...dashboard.actions,
    setActiveTab: setActiveTabWrapper,
  };
  const state = dashboard.state;
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

  console.log(`📊 [TELEMETRİ] BossDashboard Render Tetiklendi. bossInfo var mı: ${!!state.bossInfo}`);

  const hasInitialData = !!initialData?.profile;



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
        isDarkMode={state.isDarkMode}
        setIsDarkMode={actions.setIsDarkMode}
        activeTab={state.activeTab}
        setActiveTab={actions.setActiveTab}
        signOut={() => signOut({ redirectUrl: "/" })}
        tabs={TABS}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {state.activeTab === 0 && (
          <OverviewSection
            bossInfo={safeBossInfo}
            realBranchesCount={state.realBranchesCount}
            activeBranchesCount={state.activeBranchesCount}
            totalEarned={state.totalEarned}
            totalSpent={state.totalSpent}
            displayEmployees={state.displayEmployees}
            displayBranches={state.displayBranches}
            setActiveTab={(tab) => actions.setActiveTab(tab === 3 ? 2 : tab)}
            isQuotaLimitReached={state.isQuotaLimitReached}
            hasNoUsername={state.hasNoUsername}
            handleDeleteBranch={actions.handleDeleteBranch}
            handleToggleBranchStatus={actions.handleToggleBranchStatus}
            setEditingBranch={actions.setEditingBranch}
            setShowAddBranch={actions.setShowAddBranch}
            setError={actions.setError}
            topCustomers={state.topCustomers}
          />
        )}
        {state.activeTab === 1 && (
          <AllBranchesSection
            isQuotaLimitReached={state.isQuotaLimitReached}
            realBranchesCount={state.realBranchesCount}
            bossInfo={safeBossInfo}
            hasNoUsername={state.hasNoUsername}
            displayBranches={state.displayBranches}
            handleDeleteBranch={actions.handleDeleteBranch}
            handleToggleBranchStatus={actions.handleToggleBranchStatus}
            setEditingBranch={actions.setEditingBranch}
            setShowAddBranch={actions.setShowAddBranch}
            setError={actions.setError}
          />
        )}
        {state.activeTab === 2 && (
          <CustomersSection
            displayCustomers={state.displayCustomers}
            isDarkMode={state.isDarkMode}
            handleAddCustomer={actions.handleAddCustomer}
          />
        )}
        {state.activeTab === 3 && (
          <BossProfileSettings
            pointRate={state.pointRate}
            validityMonths={state.validityMonths}
            bossName={safeBossInfo.name}
            orgName={safeBossInfo.orgName}
            isDarkMode={state.isDarkMode}
            onSaveSettings={actions.handleSaveSettings}
            onUpdateName={async (f, l) => {
              if (user?.id) {
                await actions.handleUpdateMember(user.id, f, l);
              }
            }}
            savingSettings={state.savingSettings}
            settingsSaved={state.settingsSaved}
            employees={state.displayEmployees}
            handleUpdateMember={actions.handleUpdateMember}
            handleRemoveMember={actions.handleRemoveMember}
            setReassigningEmployee={actions.setReassigningEmployee}
            setShowInvite={actions.setShowInvite}
            loadingId={state.loadingId}
            hasNoUsername={state.hasNoUsername}
            invitations={state.invitations}
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
