"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClerk, useUser } from "@clerk/nextjs";

import { 
  getManagerProfile, 
  getBranchTransactions, 
  getCustomers, 
  getOrgMembers,
  removeMember,
  updateMemberName
} from "./actions";

// Components
import { ManagerHeader } from "@/components/features/manager-dashboard/ManagerHeader";
import { OverviewStats } from "@/components/features/manager-dashboard/OverviewStats";
import { TransactionFeed } from "@/components/features/manager-dashboard/TransactionFeed";
import { EmployeeManagement } from "@/components/features/manager-dashboard/EmployeeManagement";
import { CustomerManagement } from "@/components/features/manager-dashboard/CustomerManagement";
import { InviteModal } from "@/components/features/boss-dashboard/InviteModal";

// Types
import { Transaction, Customer, Employee } from "@/components/features/manager-dashboard/types";

const TABS = ["Genel Bakış", "Müşteriler", "Ekibim"];

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showMockData, setShowMockData] = useState(false);
  
  // Real Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cashiers, setCashiers] = useState<Employee[]>([]);
  const [branchInfo, setBranchInfo] = useState<{name: string, orgId: string} | null>(null);
  
  // UI State
  const [showInvite, setShowInvite] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  const { user } = useUser();
  const { signOut } = useClerk();

  const refreshData = useCallback(async () => {
    try {
      const [profile, txs, custs, emps] = await Promise.all([
        getManagerProfile(),
        getBranchTransactions(),
        getCustomers(),
        getOrgMembers()
      ]);
      
      setBranchInfo({ name: profile.branchName, orgId: profile.orgId || "" });
      
      const mappedTxs: Transaction[] = (txs as { id: string; customerFirstName?: string | null; customerLastName?: string | null; transactionType: string; amount: number; createdAt: Date | null }[]).map(t => ({
        id: t.id,
        customer: `${t.customerFirstName || ""} ${t.customerLastName || ""}`.trim() || "Bilinmeyen Müşteri",
        type: t.transactionType === "earn" ? "earned" : t.transactionType === "spend" ? "spent" : "new",
        pts: t.amount,
        amount: t.amount * 2, // Mock amount calculation
        cashier: "Kasiyer", // Placeholder
        time: t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"
      }));

      setTransactions(mappedTxs);
      setCustomers(custs as Customer[]);
      // Sadece kasiyerleri filtrele
      const filteredCashiers = (emps as Employee[]).filter(e => e.role === "cashier");
      setCashiers(filteredCashiers);
    } catch (err) {
      console.error("Manager data fetch error:", err);
    } finally {
      // Loading finished
    }
  }, []);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        refreshData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, refreshData]);

  const handleRemoveCashier = async (id: string) => {
    if (!confirm("Bu kasiyeri silmek istediğinize emin misiniz?")) return;
    setLoadingId(id);
    try {
      await removeMember(id);
      await refreshData();
    } finally {
      setLoadingId(null);
    }
  };

  const handleUpdateCashier = async (id: string, f: string, l: string) => {
    setLoadingId(id);
    try {
      await updateMemberName(id, f, l);
      await refreshData();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 font-sans ${isDarkMode ? "bg-[#0f172a] text-white" : "bg-slate-50 text-slate-900"}`}>
      <AnimatePresence>
        {showInvite && (
          <InviteModal 
            onClose={() => { setShowInvite(false); refreshData(); }} 
            branches={branchInfo ? [{ id: branchInfo.orgId, name: branchInfo.name }] : []} 
            isDarkMode={isDarkMode}
            fixedRole="cashier"
          />
        )}
      </AnimatePresence>

      <ManagerHeader 
        user={user}
        showMockData={showMockData}
        setShowMockData={setShowMockData}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        signOut={() => signOut({ redirectUrl: "/" })}
        tabs={TABS}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <OverviewStats 
                    txCount={transactions.length}
                    totalPts={transactions.reduce((s, t) => s + Math.abs(t.pts), 0)}
                    activeEmployees={`${cashiers.length} Aktif`}
                    isDarkMode={isDarkMode}
                  />
                  <div className="glass-panel-elevated rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-bold text-lg text-white">Son İşlemler</h2>
                      <div className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-500 text-[10px] font-bold uppercase tracking-wider">
                        Canlı Akış
                      </div>
                    </div>
                    <TransactionFeed 
                      transactions={transactions}
                      isDarkMode={isDarkMode}
                      onEdit={() => {}}
                      flash={false}
                    />
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="glass-panel-elevated rounded-3xl p-8">
                    <EmployeeManagement 
                      employees={cashiers}
                      isDarkMode={isDarkMode}
                      onUpdate={handleUpdateCashier}
                      onRemove={handleRemoveCashier}
                      onAddClick={() => setShowInvite(true)}
                      loadingId={loadingId}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="glass-panel-elevated rounded-3xl p-8 transition-all">
                <CustomerManagement 
                  customers={customers}
                  isDarkMode={isDarkMode}
                  onUpdate={async () => {}}
                  onDelete={async () => {}}
                  onAdd={async () => { await refreshData(); }}
                  loadingId={null}
                />
              </div>
            )}
            
            {activeTab === 2 && (
              <div className="glass-panel-elevated rounded-3xl p-8 transition-all">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white">Ekip Yönetimi</h2>
                  <button 
                    onClick={() => setShowInvite(true)}
                    className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold"
                  >
                    Kasiyer Davet Et
                  </button>
                </div>
                <EmployeeManagement 
                  employees={cashiers}
                  isDarkMode={isDarkMode}
                  onUpdate={handleUpdateCashier}
                  onRemove={handleRemoveCashier}
                  onAddClick={() => setShowInvite(true)}
                  loadingId={loadingId}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

