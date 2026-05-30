"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClerk, useUser, useOrganization } from "@clerk/nextjs";
import { DashboardLoadingScreen } from "@/components/dashboard/DashboardLoadingScreen";
import { useManagerDashboard } from "@/components/features/manager-dashboard/hooks/useManagerDashboard";
import { ManagerHeader } from "@/components/features/manager-dashboard/ui/ManagerHeader";
import { ManagerDashboardModals } from "@/components/features/manager-dashboard/modals/ManagerDashboardModals";
import { TransactionsSection, CustomersSection, StaffSection } from "@/components/features/manager-dashboard/sections";
import { Transaction } from "@/components/features/manager-dashboard/types";

const TABS = ["Genel Bakış", "Müşteriler", "Ekibim"];

interface ManagerDashboardClientProps {
  initialManagerName: string;
  initialBranchName: string;
}

export function ManagerDashboardClient({
  initialManagerName,
  initialBranchName
}: ManagerDashboardClientProps) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { organization } = useOrganization();
  const [showInvite, setShowInvite] = useState(false);
  const [showSignOutOverlay, setShowSignOutOverlay] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const dashboard = useManagerDashboard();

  if (!isLoaded || (user && !dashboard.branchInfo)) {
    const displayName = user 
      ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.emailAddresses[0].emailAddress.split("@")[0]) 
      : null;
    return (
      <DashboardLoadingScreen
        userName={initialManagerName || displayName}
        orgName={initialBranchName || dashboard.branchInfo?.name || (user?.publicMetadata?.orgName as string) || null}
        logoUrl={organization?.imageUrl || null}
      />
    );
  }

  const managerName = initialManagerName || user?.fullName || "Yönetici";
  const branchName = initialBranchName || dashboard.branchInfo?.name || "Yükleniyor...";

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 font-sans ${dashboard.isDarkMode ? "bg-[#0f172a] text-white" : "bg-slate-50 text-slate-900"}`}>
      <ManagerDashboardModals 
        showInvite={showInvite} setShowInvite={setShowInvite}
        branchInfo={dashboard.branchInfo} refreshData={dashboard.refreshData}
        showSignOutOverlay={showSignOutOverlay} signOut={signOut}
        showAddCustomer={showAddCustomer} setShowAddCustomer={setShowAddCustomer}
        handleAddCustomer={dashboard.handleAddCustomer}
        editingTransaction={editingTransaction} setEditingTransaction={setEditingTransaction}
        handleEditPointsSave={dashboard.handleEditPointsSave} isDarkMode={dashboard.isDarkMode}
      />
      <ManagerHeader 
        user={user} showMockData={dashboard.showMockData} setShowMockData={dashboard.setShowMockData}
        isDarkMode={dashboard.isDarkMode} setIsDarkMode={dashboard.setIsDarkMode}
        activeTab={dashboard.activeTab} setActiveTab={dashboard.setActiveTab}
        signOut={() => setShowSignOutOverlay(true)} tabs={TABS}
        managerName={managerName} branchName={branchName}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={dashboard.activeTab} initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
          >
            {dashboard.activeTab === 0 && (
              <TransactionsSection 
                transactions={dashboard.transactions} cashiers={dashboard.cashiers}
                isDarkMode={dashboard.isDarkMode} showMockData={dashboard.showMockData}
                onEditTransaction={setEditingTransaction}
              />
            )}
            {dashboard.activeTab === 1 && (
              <CustomersSection 
                customers={dashboard.customers}
                transactions={dashboard.transactions}
                isDarkMode={dashboard.isDarkMode}
                searchQuery={dashboard.customerSearch}
                onSearchChange={dashboard.setCustomerSearch}
              />
            )}
            {dashboard.activeTab === 2 && (
              <StaffSection 
                cashiers={dashboard.cashiers} isDarkMode={dashboard.isDarkMode}
                handleUpdateCashier={dashboard.handleUpdateCashier} handleRemoveCashier={dashboard.handleRemoveCashier}
                handleToggleStatus={dashboard.handleToggleStatus}
                setShowInvite={setShowInvite} loadingId={dashboard.loadingId}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
