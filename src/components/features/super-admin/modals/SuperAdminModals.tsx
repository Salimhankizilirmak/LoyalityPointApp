"use client";

import { AnimatePresence } from "framer-motion";
import { InviteBossModal } from "./InviteBossModal";
import { UpdateQuotaModal } from "./UpdateQuotaModal";
import { AddOrgModal } from "./AddOrgModal";
import { Organization } from "../types";
import { useRouter } from "next/navigation";

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
    signOut: (options?: { redirectUrl?: string }) => Promise<void>;
  };
}

export function SuperAdminModals({ state, actions }: SuperAdminModalsProps) {
  const { showInvite, showAddOrg, editingQuotaOrg, showSignOutOverlay, isDarkMode } = state;
  const { setShowInvite, setShowAddOrg, setEditingQuotaOrg, loadData, signOut } = actions;
  const router = useRouter();

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
          onAdd={() => {}}
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

    </AnimatePresence>
  );
}
