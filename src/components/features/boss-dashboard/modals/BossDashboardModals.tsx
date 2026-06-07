"use client";

import { motion, AnimatePresence } from "framer-motion";
import { InviteModal } from "../ui/InviteModal";
import { AddBranchModal } from "../ui/AddBranchModal";
import { ChangeManagerModal } from "../ui/ChangeManagerModal";
import { ReassignBranchModal } from "../ui/ReassignBranchModal";
import { SignOutOverlay } from "@/components/dashboard/SignOutOverlay";
import { BossProfileSettings } from "../ui/BossProfileSettings";
import { Branch, Employee, BossInfo } from "../types";
import { useRouter } from "next/navigation";

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
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
  isDeleting: boolean;
  deleteType: "branch" | "staff";
  isTogglingStatus: boolean;
  toggleAction: "activate" | "deactivate" | null;
  displayBranches: Branch[];
  managers: Employee[];
  isDarkMode: boolean;
  bossInfo: BossInfo | null;
  pointRate: number;
  validityMonths: number;
  savingSettings: boolean;
  settingsSaved: boolean;
  handleCreateBranch: (data: { name: string; city: string }) => Promise<void>;
  handleChangeManager: (branchId: number | string, managerId: string) => Promise<void>;
  handleReassignMember: (memberId: string, branchName: string, orgId: string) => Promise<void>;
  handleSaveSettings: (rate: number, validity: number) => Promise<void>;
  handleUpdateMember: (id: string, fName: string, lName: string) => Promise<void>;
  userId: string | undefined;
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
  showProfileModal,
  setShowProfileModal,
  isDeleting,
  deleteType,
  isTogglingStatus,
  toggleAction,
  displayBranches,
  managers,
  isDarkMode,
  bossInfo,
  pointRate,
  validityMonths,
  savingSettings,
  settingsSaved,
  handleCreateBranch,
  handleChangeManager,
  handleReassignMember,
  handleSaveSettings,
  handleUpdateMember,
  userId,
  refreshData,
  signOut,
}: BossDashboardModalsProps) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {showInvite && (
        <InviteModal
          onClose={() => {
            setShowInvite(false);
            refreshData();
          }}
          branches={displayBranches.filter((b) => b.status === "active")}
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

      {/* ─── Profil & Ayarlar Modal ─────────────────────────────────────────── */}
      {showProfileModal && (
        <motion.div
          key="profile-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-16 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowProfileModal(false);
          }}
        >
          <motion.div
            key="profile-modal-content"
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`rounded-3xl border shadow-2xl overflow-hidden ${
                isDarkMode
                  ? "bg-[#0f172a] border-slate-800"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              {/* Modal Header */}
              <div
                className={`flex items-center justify-between px-8 py-5 border-b ${
                  isDarkMode
                    ? "border-slate-800 bg-slate-900/60"
                    : "border-slate-100 bg-white"
                }`}
              >
                <div>
                  <h2
                    className={`font-bold text-lg ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Profil &amp; Ayarlar
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Hesap bilgilerini ve organizasyon ayarlarını yönet
                  </p>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  aria-label="Profil modalını kapat"
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isDarkMode
                      ? "hover:bg-slate-800 text-slate-400"
                      : "hover:bg-slate-100 text-slate-500"
                  }`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8">
                <BossProfileSettings
                  pointRate={pointRate}
                  validityMonths={validityMonths}
                  bossName={bossInfo?.name || ""}
                  orgName={bossInfo?.orgName || ""}
                  isDarkMode={isDarkMode}
                  onSaveSettings={handleSaveSettings}
                  onUpdateName={async (f, l) => {
                    if (userId) {
                      await handleUpdateMember(userId, f, l);
                      setShowProfileModal(false);
                      router.push("/boss-dashboard");
                      router.refresh();
                    }
                  }}
                  savingSettings={savingSettings}
                  settingsSaved={settingsSaved}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ─── Silme Yükleme Perdesi ─────────────────────────────────────────── */}
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
              {deleteType === "branch"
                ? "Sistem senkronize ediliyor, lütfen bekleyin..."
                : "Clerk davetiyeleri ve sistem yetkileri iptal ediliyor..."}
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* ─── Durum Değiştirme Perdesi ──────────────────────────────────────── */}
      {isTogglingStatus && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-md ${
            toggleAction === "deactivate" ? "bg-rose-950/80" : "bg-emerald-950/80"
          }`}
        >
          <div className="relative">
            <div
              className={`w-20 h-20 border-4 rounded-full animate-spin ${
                toggleAction === "deactivate"
                  ? "border-rose-500/20 border-t-rose-500"
                  : "border-emerald-500/20 border-t-emerald-500"
              }`}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`w-10 h-10 border-4 rounded-full animate-spin-reverse ${
                  toggleAction === "deactivate"
                    ? "border-rose-500/10 border-b-rose-400"
                    : "border-emerald-500/10 border-b-emerald-400"
                }`}
              ></div>
            </div>
          </div>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-center"
          >
            <h3 className="text-xl font-bold text-white mb-2">
              {toggleAction === "deactivate"
                ? "Şube Pasifleştiriliyor"
                : "Şube Aktifleştiriliyor"}
            </h3>
            <p
              className={`${
                toggleAction === "deactivate"
                  ? "text-rose-200/60"
                  : "text-emerald-200/60"
              } text-sm font-mono animate-pulse`}
            >
              {toggleAction === "deactivate"
                ? "Erişim kısıtlanıyor..."
                : "Erişim yetkileri tanımlanıyor..."}
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* ─── Çıkış Perdesi ────────────────────────────────────────────────── */}
      {showSignOutOverlay && (
        <SignOutOverlay
          onCountdownComplete={async () => {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("signing_out", "true");
            }
            await signOut({ redirectUrl: "/" });
          }}
        />
      )}
    </AnimatePresence>
  );
}
