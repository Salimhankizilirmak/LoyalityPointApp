"use client";

import { AnimatePresence } from "framer-motion";
import { InviteBossModal } from "./InviteBossModal";
import { UpdateQuotaModal } from "./UpdateQuotaModal";
import { AddOrgModal } from "./AddOrgModal";
import { SignOutOverlay } from "@/components/dashboard/SignOutOverlay";
import { Organization } from "../types";

interface SuperAdminModalsProps {
  state: {
    showInvite: boolean;
    showAddOrg: boolean;
    editingQuotaOrg: Organization | null;
    showSignOutOverlay: boolean;
    isDarkMode: boolean;
  };
  actions: {
    setShowInvite: (show: boolean) => void;
    setShowAddOrg: (show: boolean) => void;
    setEditingQuotaOrg: (org: Organization | null) => void;
    setShowSignOutOverlay: (show: boolean) => void;
    loadData: () => Promise<void>;
    handleAddOrgMock: (form: { name: string; slug: string; email: string }) => void;
    signOut: (options?: { redirectUrl?: string }) => Promise<void>;
  };
}

export function SuperAdminModals({ state, actions }: SuperAdminModalsProps) {
  const { showInvite, showAddOrg, editingQuotaOrg, showSignOutOverlay, isDarkMode } = state;
  const { setShowInvite, setShowAddOrg, setEditingQuotaOrg, loadData, handleAddOrgMock, signOut } = actions;

  return (
    <AnimatePresence mode="wait">
      {showInvite && (
        <InviteBossModal
          onClose={() => setShowInvite(false)}
          onSuccess={loadData}
          isDarkMode={isDarkMode}
        />
      )}

      {showAddOrg && (
        <AddOrgModal
          onClose={() => setShowAddOrg(false)}
          onAdd={handleAddOrgMock}
          isDarkMode={isDarkMode}
        />
      )}

      {editingQuotaOrg && (
        <UpdateQuotaModal
          orgId={editingQuotaOrg.id}
          orgName={editingQuotaOrg.name}
          currentLimit={editingQuotaOrg.branchLimit ?? 1}
          activeBranches={editingQuotaOrg.branches}
          onClose={() => setEditingQuotaOrg(null)}
          onSuccess={() => {
            setEditingQuotaOrg(null);
            loadData();
          }}
        />
      )}

      {showSignOutOverlay && (
        <SignOutOverlay
          onCountdownComplete={() => signOut({ redirectUrl: "/" })}
        />
      )}
    </AnimatePresence>
  );
}
