"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCashierDashboard } from "@/components/features/cashier-dashboard/hooks/useCashierDashboard";
import { getCashierAcceptedCustomersAction } from "@/app/(cashier)/cashier-dashboard/actions";

import { RecentSalesSection } from "@/components/features/cashier-dashboard/sections";
import { CashierDashboardModals } from "@/components/features/cashier-dashboard/modals/CashierDashboardModals";

import { TransactionProgressModal } from "@/components/features/cashier-dashboard/modals/TransactionProgressModal";
import { CashierTransactionModal } from "@/components/features/cashier-dashboard/modals/CashierTransactionModal";
import { CustomerTransactionsHistoryModal } from "@/components/features/cashier-dashboard/modals/CustomerTransactionsHistoryModal";

import { motion } from "framer-motion";
import { Coins, CreditCard, Search, X, Clock, ArrowRight, History, Activity, Users as UsersIcon } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

const TIER_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  Bronze: { bg: "bg-amber-500/10", color: "text-amber-400", border: "border-amber-500/20" },
  Silver: { bg: "bg-slate-500/10", color: "text-slate-400", border: "border-slate-500/20" },
  Gold: { bg: "bg-yellow-500/10", color: "text-yellow-400", border: "border-yellow-500/20" },
  Platinum: { bg: "bg-cyan-500/10", color: "text-cyan-400", border: "border-cyan-500/20" },
};

interface CashierDashboardPageProps {
  dbUser: {
    name: string;
    email: string;
    branchName: string;
  };
  initialBranchStatus: { isActive: boolean; isDeleted: boolean } | null;
}

export default function CashierDashboardPage({ dbUser, initialBranchStatus }: CashierDashboardPageProps) {
  const router = useRouter();
  const { state, actions } = useCashierDashboard(initialBranchStatus);
  const { user: clerkUser } = useUser();

  const searchRef = useRef<HTMLInputElement>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  const [acceptedCustomers, setAcceptedCustomers] = useState<any[]>([]);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);


  const loadAcceptedCustomers = async () => {
    const res = await getCashierAcceptedCustomersAction();
    if (res.success && res.customers) setAcceptedCustomers(res.customers);
  };

  useEffect(() => {
    loadAcceptedCustomers();
    // Autofocus search on mount
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark !== isDarkMode) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setIsDarkMode(isDark);
    }
  }, [isDarkMode]);

  const toggleTheme = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
      localStorage.setItem("theme", "light");
    }
  };

  const openActionModal = (type: "EARN" | "BURN") => {
    actions.setTxType(type);
    actions.setAmount("");
    actions.setTxError("");
    setIsActionModalOpen(true);
  };



  const handleInputChange = (val: string) => {
    const numericVal = val.replace(/\D/g, "");
    if (numericVal.length <= 11) {
      actions.setScanInput(numericVal);
    }
  };

  const isValidPhone = /^05\d{9}$/.test(state.scanInput);



  return (
    <div className={`min-h-screen flex flex-col font-sans select-none antialiased transition-colors duration-300 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      <CashierDashboardModals
        branchStatus={state.branchStatus}
        showAddCustomer={false}
        setShowAddCustomer={actions.setShowAddCustomer}
        handleAddCustomer={actions.handleAddCustomer}
      />



      <main className="flex-1 w-full px-4 py-6 flex flex-col gap-6">
        
        {/* ── 1. ÜST KISIM: KAMPANYA VE STATS ── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full mb-2">
          {/* Mevcut Kampanya Kartı */}
          <div className={`flex flex-col justify-center px-6 py-3 rounded-2xl border shadow-sm flex-shrink-0 ${
            isDarkMode ? "bg-indigo-900/20 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"
          }`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-0.5">Mevcut Kampanya</span>
            <span className={`text-sm font-bold ${isDarkMode ? "text-indigo-300" : "text-indigo-700"}`}>Yok</span>
          </div>

          {/* İstatistikler */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">

          <div className="grid grid-cols-3 gap-4 w-full max-w-2xl mt-2">
            <div className={`flex flex-col items-center justify-center py-3 rounded-2xl border ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Activity size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">İşlem</span>
              </div>
              <span className={`text-xl font-black font-mono ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                {state.stats.totalTxToday}
              </span>
            </div>
            
            <div className={`flex flex-col items-center justify-center py-3 rounded-2xl border ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center gap-1.5 text-cyan-500 mb-1">
                <Coins size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Puan (Verilen)</span>
              </div>
              <span className="text-xl font-black font-mono text-cyan-500">
                {fmt(state.stats.ptsGivenToday)}
              </span>
            </div>
            
            <div className={`flex flex-col items-center justify-center py-3 rounded-2xl border ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
                <UsersIcon size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Yeni Üye</span>
              </div>
              <span className="text-xl font-black font-mono text-emerald-500">
                {state.stats.newMembersToday}
              </span>
            </div>
          </div>
          </div>
        </div>

        {/* ── 2. ORTA KISIM: ARAMA VE MÜŞTERİ (Eşit Genişlik & Yükseklik) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* SOL KOLON: Müşteri Arama */}
          <div className={`flex flex-col justify-center items-center p-8 rounded-3xl border shadow-sm relative ${
            isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200"
          }`}>
            <div className="w-full max-w-md flex flex-col gap-4">
              <div className="text-center mb-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-500">
                  <Search size={32} />
                </div>
                <h2 className={`text-xl font-black uppercase tracking-wider ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                  Müşteri Sorgula
                </h2>
                <p className={`text-sm mt-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  İşlem yapmak için telefon numarası girin.
                </p>
              </div>

              <div className="relative w-full mt-4">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  ref={searchRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={11}
                  value={state.scanInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isValidPhone) {
                      actions.handleScan(state.scanInput);
                    }
                  }}
                  placeholder="05XXXXXXXXX"
                  className={`w-full h-16 pl-12 pr-4 text-center rounded-2xl border text-xl outline-none transition-all placeholder-slate-400 font-mono shadow-sm ${
                    isDarkMode
                      ? "bg-slate-900/80 border-white/10 text-white focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500"
                  }`}
                />
              </div>

              <button
                onClick={() => actions.handleScan(state.scanInput)}
                disabled={state.scanning || !isValidPhone}
                className="w-full h-14 rounded-2xl text-base font-black uppercase tracking-widest text-white transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 shadow-lg mt-2"
                style={{
                  background: isValidPhone
                    ? "linear-gradient(to right, #0891b2, #10b981)"
                    : isDarkMode ? "#1e293b" : "#cbd5e1",
                }}
              >
                {state.scanning ? "Aranıyor..." : "Müşteri Ara"}
              </button>
              
              {state.searchError && (
                <div className="text-red-500 text-xs font-bold mt-2 text-center bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">
                  {state.searchError}
                </div>
              )}
            </div>
          </div>

          {/* SAĞ KOLON: Müşteri Kartı ve Aksiyonlar */}
          <div className="flex flex-col h-full">
            {state.customer ? (
              <motion.div
                animate={{
                  backgroundColor: isActionModalOpen && state.txType === "EARN"
                    ? (isDarkMode ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.05)")
                    : isActionModalOpen && state.txType === "BURN"
                    ? (isDarkMode ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.05)")
                    : (isDarkMode ? "rgba(15, 23, 42, 0.6)" : "#ffffff"),
                  borderColor: isActionModalOpen && state.txType === "EARN"
                    ? "rgba(16, 185, 129, 0.3)"
                    : isActionModalOpen && state.txType === "BURN"
                    ? "rgba(245, 158, 11, 0.3)"
                    : (isDarkMode ? "rgba(99, 102, 241, 0.1)" : "#e2e8f0"),
                }}
                transition={{ duration: 0.4 }}
                className={`p-5 rounded-3xl border shadow-lg relative`}
              >
                <button
                  onClick={() => { actions.reset(); searchRef.current?.focus(); }}
                  className={`absolute right-4 top-4 p-1.5 rounded-full border transition-all cursor-pointer ${
                    isDarkMode
                      ? "bg-white/5 border-white/10 text-slate-400 active:bg-red-500/20 active:text-red-400"
                      : "bg-slate-50 border-slate-200 text-slate-500 active:bg-red-500/10 active:text-red-500"
                  }`}
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-xl font-black text-white shadow-lg shrink-0">
                    {state.customer.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-lg font-bold leading-none ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                        {state.customer.name}
                      </h3>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border shrink-0 ${TIER_COLORS[state.customer.tier]?.bg || "bg-slate-500/10"} ${TIER_COLORS[state.customer.tier]?.color || "text-slate-400"} ${TIER_COLORS[state.customer.tier]?.border || "border-slate-500/20"}`}>
                        {state.customer.tier}
                      </span>
                    </div>
                    <p className={`text-sm font-mono ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {state.customer.phone}
                    </p>
                  </div>
                  <div className="ml-auto text-right mr-6">
                    <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 font-mono tracking-tight leading-none">
                      {fmt(state.customer.pts)}
                    </p>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest font-mono mt-1">
                      Bakiye
                    </p>
                  </div>
                </div>

                {/* Son İşlem Özeti Kaldırıldı, Alt Listeye Taşındı */}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsHistoryModalOpen(true)}
                  className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border ${
                    isDarkMode
                      ? "bg-indigo-500/10 active:bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                      : "bg-slate-100 active:bg-slate-200 border-slate-200 text-slate-700"
                  }`}
                >
                  <History size={16} />
                  <span>Geçmişi Gör</span>
                  <ArrowRight size={16} />
                </motion.button>

                {/* Aksiyon Butonları (Tam Genişlik, Büyük Tasarım) */}
                <div className="flex flex-col gap-3 mt-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    disabled={!state.customer}
                    onClick={() => openActionModal("EARN")}
                    id="btn-earn-points"
                    className={`w-full h-20 rounded-2xl font-black uppercase tracking-widest text-base flex items-center justify-center gap-3 border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
                      state.customer
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500 border-emerald-500/30 text-white shadow-xl shadow-emerald-500/20"
                        : isDarkMode
                        ? "bg-slate-900/40 border-slate-800 text-slate-600"
                        : "bg-slate-100 border-slate-200 text-slate-400"
                    }`}
                  >
                    <Coins size={26} />
                    <span>Puan Kazan</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    disabled={!state.customer}
                    onClick={() => openActionModal("BURN")}
                    id="btn-spend-points"
                    className={`w-full h-20 rounded-2xl font-black uppercase tracking-widest text-base flex items-center justify-center gap-3 border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
                      state.customer
                        ? "bg-gradient-to-r from-amber-600 to-amber-500 border-amber-500/30 text-white shadow-xl shadow-amber-500/20"
                        : isDarkMode
                        ? "bg-slate-900/40 border-slate-800 text-slate-600"
                        : "bg-slate-100 border-slate-200 text-slate-400"
                    }`}
                  >
                    <CreditCard size={26} />
                    <span>Puan Harca</span>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <div className={`flex flex-col items-center justify-center h-full p-8 rounded-3xl border shadow-sm ${
                isDarkMode ? "bg-slate-900/20 border-white/5" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="w-16 h-16 rounded-full bg-slate-500/10 flex items-center justify-center mb-4 text-slate-400">
                  <UsersIcon size={32} />
                </div>
                <h3 className={`text-lg font-bold mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  İşlem Bekleniyor
                </h3>
                <p className="text-sm text-slate-500 text-center max-w-xs">
                  Müşteri işlemleri yapabilmek için sol taraftan telefon numarası ile müşteri araması gerçekleştirin.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. ALT KISIM: ARATILAN MÜŞTERİNİN SON İŞLEMLERİ ── */}
        <div className={`rounded-3xl border overflow-hidden flex flex-col min-h-[300px] shadow-sm ${
          isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200"
        }`}>
          <div className="p-5 border-b border-white/5 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isDarkMode ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-600"
            }`}>
              <History size={18} />
            </div>
            <div>
              <h3 className={`font-black uppercase tracking-widest text-sm ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                Müşteri İşlem Geçmişi
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                {state.customer ? `${state.customer.name} için son kayıtlar` : "Lütfen bir müşteri sorgulayın."}
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {!state.customer ? (
              <div className="flex items-center justify-center h-full text-sm text-slate-500 font-mono">
                [ İşlem geçmişi için müşteri aranması bekleniyor ]
              </div>
            ) : state.auditLoading ? (
              <div className="flex items-center justify-center h-full text-sm text-slate-500 font-mono animate-pulse">
                [ Yükleniyor... ]
              </div>
            ) : state.auditTransactions.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-slate-500 font-mono">
                [ Bu müşteriye ait geçmiş işlem bulunamadı ]
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.auditTransactions.map(tx => (
                  <div key={tx.id} className={`p-4 rounded-2xl border flex flex-col gap-2 ${
                    isDarkMode ? "bg-slate-950/50 border-white/5" : "bg-slate-50 border-slate-100"
                  }`}>
                    <div className="flex justify-between items-center">
                       <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                         tx.status === "VOIDED" ? "bg-red-500/20 text-red-500" :
                         tx.type === "EARN" ? "bg-emerald-500/20 text-emerald-500" :
                         "bg-amber-500/20 text-amber-500"
                       }`}>
                         {tx.status === "VOIDED" ? "İPTAL" : tx.type === "EARN" ? "Kazanım" : "Harcama"}
                       </span>
                       <span className="text-xs font-mono text-slate-500">{tx.createdAtFormatted}</span>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                       <span className="text-xs text-slate-400">Puan Değişimi:</span>
                       <span className={`text-lg font-black font-mono ${tx.pointsAmount > 0 ? "text-emerald-500" : "text-amber-500"}`}>
                         {tx.pointsAmount > 0 ? "+" : ""}{tx.pointsAmount} Pts
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals and Drawer */}


      <CashierTransactionModal
        isOpen={isActionModalOpen && !state.lastTxReceipt}
        onClose={() => setIsActionModalOpen(false)}
        customer={state.customer}
        txType={state.txType}
        setTxType={actions.setTxType}
        amount={state.amount}
        setAmount={actions.setAmount}
        totalCartAmount={state.totalCartAmount}
        setTotalCartAmount={actions.setTotalCartAmount}
        ptsPreview={state.ptsPreview}
        isPending={state.isPending}
        txError={state.txError}
        handleTx={actions.handleTx}
        isDarkMode={isDarkMode}
      />

      <CustomerTransactionsHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        customer={state.customer}
        transactions={state.auditTransactions}
        loading={state.auditLoading}
        isDarkMode={isDarkMode}
      />



      <TransactionProgressModal
        isPending={state.isPending}
        receipt={state.lastTxReceipt}
        txError={state.txError}
        onClose={() => {
          actions.clearTxReceipt();
          searchRef.current?.focus();
        }}
      />
    </div>
  );
}