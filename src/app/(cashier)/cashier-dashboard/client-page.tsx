"use client";

import { motion } from "framer-motion";
import { Zap, Star, User, ScanLine, Wifi, LogOut } from "lucide-react";
import { useCashierDashboard } from "@/components/features/cashier-dashboard/hooks/useCashierDashboard";
import { ScannerSection, RecentSalesSection } from "@/components/features/cashier-dashboard/sections";
import { CashierDashboardModals } from "@/components/features/cashier-dashboard/modals/CashierDashboardModals";

const INDIGO = "#4f46e5";
const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

export default function CashierDashboardPage() {
  const { state, actions } = useCashierDashboard();

  return (
    <div className="min-h-screen w-full" style={{ background: "#f8fafc", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <CashierDashboardModals 
        branchStatus={state.branchStatus}
        showAddCustomer={state.showAddCustomer}
        setShowAddCustomer={actions.setShowAddCustomer}
        handleAddCustomer={actions.handleAddCustomer}
        showSignOutOverlay={state.showSignOutOverlay}
        onSignOutCountdownComplete={() => actions.signOut({ redirectUrl: "/" })}
      />

      <div className="bg-white sticky top-0 z-20" style={{ borderBottom: "1px solid #f1f5f9" }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: INDIGO }}>
              <ScanLine size={15} className="text-white" />
            </div>
            <div>
              <p className="text-slate-900 font-bold text-sm leading-tight">Kasa Paneli</p>
              <p className="text-slate-400 text-xs">Aktif Oturum</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "#eef2ff", border: "1px solid #c7d2fe" }}>
              <Wifi size={12} style={{ color: INDIGO }} />
              <span className="text-xs font-semibold" style={{ color: INDIGO }}>Canlı</span>
            </div>
            <button 
              onClick={() => actions.setShowSignOutOverlay(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-all border border-slate-200 hover:border-rose-200 text-xs font-semibold"
            >
              <LogOut size={12} />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Bugün İşlem", value: String(state.stats.totalTxToday), icon: Zap, color: INDIGO },
              { label: "Dağıtılan Puan", value: fmt(state.stats.ptsGivenToday), icon: Star, color: INDIGO },
              { label: "Yeni Üye", value: String(state.stats.newMembersToday), icon: User, color: "#059669" },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="rounded-2xl p-4 bg-white text-center" style={{ border: "1px solid #f1f5f9" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${color}12` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <p className="text-slate-900 font-bold text-lg">{value}</p>
                <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">{label}</p>
              </motion.div>
            ))}
          </div>

          <ScannerSection 
            customer={state.customer} scanInput={state.scanInput} setScanInput={actions.setScanInput}
            scanning={state.scanning} handleScan={actions.handleScan} txType={state.txType}
            setTxType={actions.setTxType} amount={state.amount} setAmount={actions.setAmount}
            txSuccess={state.txSuccess} txError={state.txError} ptsPreview={state.ptsPreview}
            isPending={state.isPending} handleTx={actions.handleTx} reset={actions.reset}
            setShowAddCustomer={actions.setShowAddCustomer}
          />
        </div>

        <RecentSalesSection refreshTrigger={state.stats.totalTxToday} />
      </div>
    </div>
  );
}
