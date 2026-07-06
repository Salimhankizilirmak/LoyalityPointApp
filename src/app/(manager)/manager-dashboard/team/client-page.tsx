"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClerk } from "@clerk/nextjs";
import { useManagerDashboard } from "@/components/features/manager-dashboard/hooks/useManagerDashboard";
import { ManagerDashboardModals } from "@/components/features/manager-dashboard/modals/ManagerDashboardModals";
import { StaffSection } from "@/components/features/manager-dashboard/sections";

export function TeamClient({
  initialData
}: {
  initialData?: any;
}) {
  const { signOut } = useClerk();
  const [showInvite, setShowInvite] = useState(false);
  const dashboard = useManagerDashboard(initialData);

  return (
    <>
      <ManagerDashboardModals 
        showInvite={showInvite} setShowInvite={setShowInvite}
        branchInfo={dashboard.branchInfo} refreshData={dashboard.refreshData}
        showSignOutOverlay={false} signOut={signOut}
        showAddCustomer={false} setShowAddCustomer={() => {}}
        handleAddCustomer={dashboard.handleAddCustomer}
        editingTransaction={null} setEditingTransaction={() => {}}
        handleEditPointsSave={dashboard.handleEditPointsSave} isDarkMode={dashboard.isDarkMode}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            transition={{ duration: 0.2 }}
          >
            <StaffSection 
              cashiers={dashboard.cashiers} isDarkMode={dashboard.isDarkMode}
              transactions={dashboard.transactions}
              handleUpdateCashier={dashboard.handleUpdateCashier} handleRemoveCashier={dashboard.handleRemoveCashier}
              handleToggleStatus={dashboard.handleToggleStatus}
              setShowInvite={setShowInvite} loadingId={dashboard.loadingId}
              invitations={dashboard.invitations}
            />
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
