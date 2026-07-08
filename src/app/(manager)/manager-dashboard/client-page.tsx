"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClerk, useUser, useOrganization } from "@clerk/nextjs";
import { useManagerDashboard } from "@/components/features/manager-dashboard/hooks/useManagerDashboard";

import { ManagerDashboardModals } from "@/components/features/manager-dashboard/modals/ManagerDashboardModals";
import { TransactionsSection, CustomersSection, StaffSection, CampaignSection } from "@/components/features/manager-dashboard/sections";
import { Transaction } from "@/components/features/manager-dashboard/types";

interface OverviewClientProps {
  initialManagerName: string;
  initialBranchName: string;
  initialData?: any;
}

export function OverviewClient({
  initialManagerName,
  initialBranchName,
  initialData
}: OverviewClientProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { organization } = useOrganization();
  const [showInvite, setShowInvite] = useState(false);
  const [showSignOutOverlay, setShowSignOutOverlay] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const dashboard = useManagerDashboard(initialData);

  const managerName = initialManagerName || user?.fullName || "Yönetici";
  const branchName = initialBranchName || dashboard.branchInfo?.name || "Yükleniyor...";

  return (
    <>
      <ManagerDashboardModals 
        showInvite={showInvite} setShowInvite={setShowInvite}
        branchInfo={dashboard.branchInfo} refreshData={dashboard.refreshData}
        showSignOutOverlay={showSignOutOverlay} signOut={signOut}
        showAddCustomer={showAddCustomer} setShowAddCustomer={setShowAddCustomer}
        handleAddCustomer={dashboard.handleAddCustomer}
        editingTransaction={editingTransaction} setEditingTransaction={setEditingTransaction}
        handleEditPointsSave={dashboard.handleEditPointsSave} isDarkMode={dashboard.isDarkMode}
      />

      <main className="w-full px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            transition={{ duration: 0.2 }}
          >
            <TransactionsSection 
              transactions={dashboard.transactions} cashiers={dashboard.cashiers}
              activityFeed={dashboard.activityFeed}
              isDarkMode={dashboard.isDarkMode}
              onEditTransaction={setEditingTransaction}
              storeSettings={dashboard.storeSettings}
            />
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
