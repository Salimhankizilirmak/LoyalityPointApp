"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useClerk } from "@clerk/nextjs";
import { useManagerDashboard } from "@/components/features/manager-dashboard/hooks/useManagerDashboard";
import { ManagerDashboardModals } from "@/components/features/manager-dashboard/modals/ManagerDashboardModals";
import { CampaignSection } from "@/components/features/manager-dashboard/sections";

export function CampaignsClient({
  initialData
}: {
  initialData?: any;
}) {
  const { signOut } = useClerk();
  const dashboard = useManagerDashboard(initialData);

  return (
    <>
      <ManagerDashboardModals 
        showInvite={false} setShowInvite={() => {}}
        branchInfo={dashboard.branchInfo} refreshData={dashboard.refreshData}
        showSignOutOverlay={false} signOut={signOut}
        showAddCustomer={false} setShowAddCustomer={() => {}}
        handleAddCustomer={dashboard.handleAddCustomer}
        editingTransaction={null} setEditingTransaction={() => {}}
        handleEditPointsSave={dashboard.handleEditPointsSave} isDarkMode={dashboard.isDarkMode}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            transition={{ duration: 0.2 }}
          >
            <CampaignSection isDarkMode={dashboard.isDarkMode} />
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
