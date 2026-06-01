"use client";

import { AnimatePresence } from "framer-motion";
import { InviteModal } from "@/components/features/boss-dashboard/ui/InviteModal";
import { SignOutOverlay } from "@/components/dashboard/SignOutOverlay";
import { AddCustomerModal } from "./AddCustomerModal";
import { EditPointsModal } from "./EditPointsModal";
import { Transaction } from "../types";

interface ManagerDashboardModalsProps {
  showInvite: boolean;
  setShowInvite: (show: boolean) => void;
  branchInfo: { id: string; name: string; orgId: string } | null;
  refreshData: () => Promise<void>;
  
  showSignOutOverlay: boolean;
  signOut: (options?: { redirectUrl?: string }) => Promise<void>;
  
  showAddCustomer: boolean;
  setShowAddCustomer: (show: boolean) => void;
  handleAddCustomer: (data: { firstName: string; lastName: string; phone: string; email: string }) => Promise<void>;
  
  editingTransaction: Transaction | null;
  setEditingTransaction: (tx: Transaction | null) => void;
  handleEditPointsSave: (tx: Transaction) => void;
  
  isDarkMode: boolean;
}

export function ManagerDashboardModals({
  showInvite,
  setShowInvite,
  branchInfo,
  refreshData,
  showSignOutOverlay,
  signOut,
  showAddCustomer,
  setShowAddCustomer,
  handleAddCustomer,
  editingTransaction,
  setEditingTransaction,
  handleEditPointsSave,
  isDarkMode
}: ManagerDashboardModalsProps) {
  return (
    <AnimatePresence>
      {showInvite && (
        <InviteModal 
          onClose={() => { setShowInvite(false); refreshData(); }} 
          branches={branchInfo ? [{ id: branchInfo.id, name: branchInfo.name }] : []} 
          isDarkMode={isDarkMode}
          fixedRole="cashier"
        />
      )}
      {showSignOutOverlay && (
        <SignOutOverlay
          onCountdownComplete={() => signOut({ redirectUrl: "/" })}
        />
      )}
      {showAddCustomer && (
        <AddCustomerModal
          onClose={() => setShowAddCustomer(false)}
          onAdd={handleAddCustomer}
          isDarkMode={isDarkMode}
        />
      )}
      {editingTransaction && (
        <EditPointsModal
          tx={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={handleEditPointsSave}
          isDarkMode={isDarkMode}
        />
      )}
    </AnimatePresence>
  );
}
