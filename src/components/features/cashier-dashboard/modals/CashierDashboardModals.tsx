"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Lock } from "lucide-react";
import { AddCustomerModal } from "@/components/features/manager-dashboard/modals/AddCustomerModal";
import { SignOutOverlay } from "@/components/dashboard/SignOutOverlay";

interface CashierDashboardModalsProps {
  branchStatus: { isActive: boolean; isDeleted: boolean } | null;
  showAddCustomer: boolean;
  setShowAddCustomer: (show: boolean) => void;
  handleAddCustomer: (data: { firstName: string; lastName: string; phone: string; email: string }) => Promise<void>;
  showSignOutOverlay?: boolean;
  onSignOutCountdownComplete?: () => void;
  signOutAction?: () => Promise<void>;
}

export function CashierDashboardModals({
  branchStatus,
  showAddCustomer,
  setShowAddCustomer,
  handleAddCustomer,
  showSignOutOverlay = false,
  onSignOutCountdownComplete,
  signOutAction
}: CashierDashboardModalsProps) {
  return (
    <AnimatePresence>
      {/* 1. Branch Deleted Overlay */}
      {branchStatus?.isDeleted && (
        <motion.div 
          key="branch-deleted"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center p-6 text-center"
        >
          <div className="max-w-md space-y-6">
            <div className="w-24 h-24 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto border-2 border-rose-500/20">
              <AlertTriangle size={48} className="text-rose-500" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Şubeniz Kapanmıştır</h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Bu şube artık sistemde aktif değildir. Daha fazla bilgi için lütfen yöneticinizle iletişime geçin.
            </p>
          </div>
        </motion.div>
      )}

      {/* 2. Branch Inactive/Locked Overlay */}
      {branchStatus && !branchStatus.isDeleted && !branchStatus.isActive && (
        <motion.div 
          key="branch-locked"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 text-center"
        >
          <div className="max-w-md space-y-6">
            <div className="w-24 h-24 rounded-3xl bg-amber-500/10 flex items-center justify-center mx-auto border-2 border-amber-500/20">
              <Lock size={40} className="text-amber-500" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Şube Geçici Olarak Kapalı</h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Şubeniz şu anda hizmete kapalıdır. İşlemler geçici olarak durdurulmuştur.
            </p>
          </div>
        </motion.div>
      )}

      {/* 3. Add Customer Modal */}
      {showAddCustomer && (
        <AddCustomerModal 
          key="add-customer-modal"
          onClose={() => setShowAddCustomer(false)}
          onAdd={handleAddCustomer}
          isDarkMode={true}
        />
      )}

      {/* 4. Sign Out Overlay (for modular coverage) */}
      {showSignOutOverlay && onSignOutCountdownComplete && (
        <SignOutOverlay 
          key="signout-overlay"
          onCountdownComplete={async () => {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("signing_out", "true");
            }
            if (signOutAction) {
              await signOutAction();
            } else {
              onSignOutCountdownComplete();
            }
          }}
        />
      )}
    </AnimatePresence>
  );
}
