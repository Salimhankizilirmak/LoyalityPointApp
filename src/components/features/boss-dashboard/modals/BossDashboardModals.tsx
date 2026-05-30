"use client";

import { motion, AnimatePresence } from "framer-motion";
import { InviteModal } from "../ui/InviteModal";
import { AddBranchModal } from "../ui/AddBranchModal";
import { ChangeManagerModal } from "../ui/ChangeManagerModal";
import { ReassignBranchModal } from "../ui/ReassignBranchModal";
import { SignOutOverlay } from "@/components/dashboard/SignOutOverlay";
import { Branch, Employee } from "../types";

interface BossDashboardModalsProps {
  showInvite: boolean;
  setShowInvite: (show: boolean) => void;
  showAddBranch: boolean;
  setShowAddBranch: (show: boolean) => void;
  editingBranch: Branch | null;
  setEditingBranch: (branch: Branch | null) => void;
  reassigningEmployee: Employee | null;
  setReassigningEmployee: (employee: Employee | null) => void;
  showSignOutOverlay: boolean;
  isDeleting: boolean;
  deleteType: "branch" | "staff";
  isTogglingStatus: boolean;
  toggleAction: "activate" | "deactivate" | null;
  displayBranches: Branch[];
  managers: Employee[];
  isDarkMode: boolean;
  handleCreateBranch: (data: { name: string; city: string }) => Promise<void>;
  handleChangeManager: (branchId: number | string, managerId: string) => Promise<void>;
  handleReassignMember: (memberId: string, branchName: string, orgId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  signOut: (options?: { redirectUrl?: string }) => Promise<void>;
}

export function BossDashboardModals({
  showInvite,
  setShowInvite,
  showAddBranch,
  setShowAddBranch,
  editingBranch,
  setEditingBranch,
  reassigningEmployee,
  setReassigningEmployee,
  showSignOutOverlay,
  isDeleting,
  deleteType,
  isTogglingStatus,
  toggleAction,
  displayBranches,
  managers,
  isDarkMode,
  handleCreateBranch,
  handleChangeManager,
  handleReassignMember,
  refreshData,
  signOut
}: BossDashboardModalsProps) {
  return (
    <AnimatePresence>
      {showInvite && (
        <InviteModal
          onClose={() => { setShowInvite(false); refreshData(); }}
          branches={displayBranches.filter(b => b.status === "active")}
        />
      )}
      {showAddBranch && (
        <AddBranchModal
          onClose={() => setShowAddBranch(false)}
          onAdd={handleCreateBranch}
          isDarkMode={isDarkMode}
        />
      )}
      {editingBranch && (
        <ChangeManagerModal
          branch={editingBranch}
          managers={managers}
          onClose={() => setEditingBranch(null)}
          onUpdate={handleChangeManager}
          isDarkMode={true}
        />
      )}
      {reassigningEmployee && (
        <ReassignBranchModal
          employee={reassigningEmployee}
          branches={displayBranches}
          onClose={() => setReassigningEmployee(null)}
          onUpdate={handleReassignMember}
          isDarkMode={isDarkMode}
        />
      )}
      {isDeleting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md"
        >
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-500/10 border-b-blue-400 rounded-full animate-spin-reverse"></div>
            </div>
          </div>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-center"
          >
            <h3 className="text-xl font-bold text-white mb-2 font-sans tracking-wide">
              {deleteType === "branch" ? "Şube Siliniyor" : "Ekip Üyesi Siliniyor"}
            </h3>
            <p className="text-slate-400 text-sm font-mono animate-pulse">
              {deleteType === "branch" ? "Sistem senkronize ediliyor, lütfen bekleyin..." : "Clerk davetiyeleri ve sistem yetkileri iptal ediliyor..."}
            </p>
          </motion.div>
        </motion.div>
      )}
      {isTogglingStatus && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-md ${toggleAction === "deactivate" ? "bg-rose-950/80" : "bg-emerald-950/80"}`}
        >
          <div className="relative">
            <div className={`w-20 h-20 border-4 rounded-full animate-spin ${toggleAction === "deactivate" ? "border-rose-500/20 border-t-rose-500" : "border-emerald-500/20 border-t-emerald-500"}`}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-10 h-10 border-4 rounded-full animate-spin-reverse ${toggleAction === "deactivate" ? "border-rose-500/10 border-b-rose-400" : "border-emerald-500/10 border-b-emerald-400"}`}></div>
            </div>
          </div>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-center"
          >
            <h3 className="text-xl font-bold text-white mb-2">
              {toggleAction === "deactivate" ? "Şube Pasifleştiriliyor" : "Şube Aktifleştiriliyor"}
            </h3>
            <p className={`${toggleAction === "deactivate" ? "text-rose-200/60" : "text-emerald-200/60"} text-sm font-mono animate-pulse`}>
              {toggleAction === "deactivate" ? "Erişim kısıtlanıyor..." : "Erişim yetkileri tanımlanıyor..."}
            </p>
          </motion.div>
        </motion.div>
      )}
      {showSignOutOverlay && (
        <SignOutOverlay
          onCountdownComplete={() => signOut({ redirectUrl: "/" })}
        />
      )}
    </AnimatePresence>
  );
}
