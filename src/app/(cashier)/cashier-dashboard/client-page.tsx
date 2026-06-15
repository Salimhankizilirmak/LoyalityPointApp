"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCashierDashboard } from "@/components/features/cashier-dashboard/hooks/useCashierDashboard";
import { getCashierAcceptedCustomersAction } from "@/app/(cashier)/cashier-dashboard/actions";
import { Header } from "@/components/features/cashier-dashboard/ui/Header";
import { BranchMiniStats } from "@/components/features/cashier-dashboard/ui/BranchMiniStats";
import { CustomerSearchPanel } from "@/components/features/cashier-dashboard/ui/CustomerSearchPanel";
import { InviteCustomerCard } from "@/components/features/cashier-dashboard/ui/InviteCustomerCard";
import { RecentSalesSection } from "@/components/features/cashier-dashboard/sections";
import { CashierDashboardModals } from "@/components/features/cashier-dashboard/modals/CashierDashboardModals";
import { InviteProgressModal } from "@/components/features/cashier-dashboard/modals/InviteProgressModal";
import { TransactionProgressModal } from "@/components/features/cashier-dashboard/modals/TransactionProgressModal";
import { CashierTransactionModal } from "@/components/features/cashier-dashboard/modals/CashierTransactionModal";
import { CustomerTransactionsHistoryModal } from "@/components/features/cashier-dashboard/modals/CustomerTransactionsHistoryModal";
import { Coins, CreditCard } from "lucide-react";

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

  // Mismatch ve geçiş flaşını önlemek için lazy initialization motorunu kullanıyoruz
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  const [acceptedCustomers, setAcceptedCustomers] = useState<any[]>([]);

  const loadAcceptedCustomers = async () => {
    const res = await getCashierAcceptedCustomersAction();
    if (res.success && res.customers) setAcceptedCustomers(res.customers);
  };

  useEffect(() => {
    loadAcceptedCustomers();
  }, []);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // DOM üzerindeki sınıfı dinle ve state ile anında senkronize et
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark !== isDarkMode) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setIsDarkMode(isDark);
    }
  }, [isDarkMode]);

  // Kasiyer tema butonuna bastığında hem DOM'u hem LocalStorage'ı hem de state'i senkronize et
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

  const handleInviteCustomer = async () => {
    await actions.handleInviteCustomer();
    await loadAcceptedCustomers();
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans select-none antialiased transition-colors duration-300 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"
      }`}>
      {/* Şube ve Oturum Kilit Overlay'leri */}
      <CashierDashboardModals
        branchStatus={state.branchStatus}
        showAddCustomer={false}
        setShowAddCustomer={actions.setShowAddCustomer}
        handleAddCustomer={actions.handleAddCustomer}
      />

      <Header
        isDarkMode={isDarkMode}
        setIsDarkMode={toggleTheme}
        branchName={dbUser.branchName}
        clerkUser={clerkUser}
        signOut={() => actions.signOut({ redirectUrl: "/" })}
      />

      {/* Ana Gövde */}
      <main className="flex-1 p-4 sm:p-5">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-4">

          {/* ÜST ROW: GENİŞ KASA AKSİYON BARI */}
          <div className="w-full grid grid-cols-2 gap-4 mb-6">
            <button
              disabled={!state.customer}
              onClick={() => openActionModal("EARN")}
              className={`h-14 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${state.customer
                  ? "bg-gradient-to-r from-cyan-600/80 to-cyan-500/80 hover:from-cyan-500 hover:to-cyan-400 border-cyan-500/30 text-white shadow-[0_4px_15px_rgba(8,145,178,0.2)] active:scale-98"
                  : isDarkMode
                    ? "bg-slate-900/40 border-slate-800 text-slate-600"
                    : "bg-slate-100 border-slate-200 text-slate-400"
                }`}
            >
              <Coins size={16} />
              <span>[ + Puan Kazandır ]</span>
            </button>

            <button
              disabled={!state.customer}
              onClick={() => openActionModal("BURN")}
              className={`h-14 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${state.customer
                  ? "bg-gradient-to-r from-amber-600/80 to-amber-500/80 hover:from-amber-500 hover:to-amber-400 border-amber-500/30 text-white shadow-[0_4px_15px_rgba(217,119,6,0.2)] active:scale-98"
                  : isDarkMode
                    ? "bg-slate-900/40 border-slate-800 text-slate-600"
                    : "bg-slate-100 border-slate-200 text-slate-400"
                }`}
            >
              <CreditCard size={16} />
              <span>[ - Puan Harcat ]</span>
            </button>
          </div>

          {/* Çift Sütunlu Grid Düzeni */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

            {/* Sol Sütun: Sorgulama & Profil Önizleme */}
            <div className="lg:col-span-6 flex flex-col">
              <CustomerSearchPanel
                customer={state.customer}
                scanInput={state.scanInput}
                setScanInput={actions.setScanInput}
                scanning={state.scanning}
                handleScan={actions.handleScan}
                reset={actions.reset}
                isDarkMode={isDarkMode}
                lastTransaction={state.auditTransactions[0] || null}
                loading={state.auditLoading}
                onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
                searchError={state.searchError}
              />
            </div>

            {/* Sağ Sütun: İstatistikler & Davet Formu */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="flex-shrink-0">
                <BranchMiniStats
                  totalTxToday={state.stats.totalTxToday}
                  ptsGivenToday={state.stats.ptsGivenToday}
                  newMembersToday={state.stats.newMembersToday}
                  isDarkMode={isDarkMode}
                />
              </div>
              <div className="flex-grow">
                <InviteCustomerCard
                  form={state.inviteForm}
                  setField={actions.setInviteField}
                  isFormValid={state.isInviteFormValid}
                  isEmailValid={state.isInviteEmailValid}
                  submitting={state.inviteSubmitting}
                  onSubmit={handleInviteCustomer}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          </div>

          {/* Alt Kısım: Son İşlemler Şeridi */}
          <div className="w-full border-t border-indigo-500/10 pt-4 mt-6">
            <RecentSalesSection
              refreshTrigger={state.stats.totalTxToday}
            />
          </div>
        </div>
      </main>

      {/* Modaller */}
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

      <InviteProgressModal
        submitting={state.inviteSubmitting}
        toastMessage={state.toastMessage}
      />

      <TransactionProgressModal
        isPending={state.isPending}
        receipt={state.lastTxReceipt}
        txError={state.txError}
        onClose={actions.clearTxReceipt}
      />
    </div>
  );
}