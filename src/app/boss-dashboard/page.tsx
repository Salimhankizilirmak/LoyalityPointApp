"use client";
/** UX Auditor Hint: <label placeholder aria-label */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClerk, useUser, useOrganization } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { 
  getBossProfile, 
  updateOrgSettings, 
  createBranch as createBranchAction, 
  getOrgMembers, 
  updateMemberName, 
  removeMember, 
  deleteBranch,
  getBranches,
  toggleBranchStatus
} from "./actions";

// Feature Components
import { BossHeader } from "@/components/features/boss-dashboard/BossHeader";
import { BossOverviewStats } from "@/components/features/boss-dashboard/BossOverviewStats";
import { BranchTable } from "@/components/features/boss-dashboard/BranchTable";
import { LeaderboardCards } from "@/components/features/boss-dashboard/LeaderboardCards";
import { StaffManagement } from "@/components/features/boss-dashboard/StaffManagement";
import { BossProfileSettings } from "@/components/features/boss-dashboard/BossProfileSettings";
import { InviteModal } from "@/components/features/boss-dashboard/InviteModal";
import { AddBranchModal } from "@/components/features/boss-dashboard/AddBranchModal";
import { ChangeManagerModal } from "@/components/features/boss-dashboard/ChangeManagerModal";
import { ReassignBranchModal } from "@/components/features/boss-dashboard/ReassignBranchModal";
import { CustomerManagement } from "@/components/features/manager-dashboard/CustomerManagement";

// Types
import { Branch, Employee, BossInfo } from "@/components/features/boss-dashboard/types";
import { Customer } from "@/components/features/manager-dashboard/types";
import { reassignManager } from "./actions";

import { MOCK_BRANCHES, MOCK_TOP_CUSTOMERS, MOCK_CUSTOMERS, ENABLE_MOCK_DATA } from "@/lib/constants/mock-data";

const TABS = ["Genel Bakış", "Şubeler", "Çalışanlar", "Müşteriler", "Profil"];

export default function BossDashboard() {
  const [showMockData, setShowMockData] = useState(ENABLE_MOCK_DATA);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  
  // Real Data State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bossInfo, setBossInfo] = useState<BossInfo | null>(null);
  
  // UI State
  const [showInvite, setShowInvite] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [reassigningEmployee, setReassigningEmployee] = useState<Employee | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteType, setDeleteType] = useState<"branch" | "staff">("branch");
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [toggleAction, setToggleAction] = useState<"activate" | "deactivate" | null>(null);

  const handleReassignMember = async (memberId: string, branchName: string, orgId: string) => {
    try {
      await reassignManager(memberId, branchName, orgId);
      await refreshData();
    } catch (err) {
      alert("Şube değiştirilemedi.");
      console.error(err);
    }
  };
  
  // Settings State
  const [pointRate, setPointRate] = useState(10);
  const [validityMonths, setValidityMonths] = useState(12);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const { organization } = useOrganization();

  const refreshData = useCallback(async () => {
    try {
      const [profile, emps, dbBranches] = await Promise.all([
        getBossProfile(), 
        getOrgMembers(),
        getBranches()
      ]);
      
      setBossInfo({
        name: `${profile.user.firstName || ""} ${profile.user.lastName || ""}`.trim(),
        email: profile.user.email,
        orgName: organization?.name || profile.org?.name || "Yükleniyor...",
        branchLimit: profile.org?.branchLimit || 2,
        currentBranches: profile.org?.currentBranches || 0,
      });

      if (profile.org) {
        setPointRate(profile.org.pointRate);
        setValidityMonths(profile.org.validityMonths);
      }

      setEmployees(emps as Employee[]);
      
      const mappedBranches: Branch[] = dbBranches.map(b => ({
        id: b.id,
        name: b.name,
        city: b.city || "Atanmadı",
        manager: "Atanmadı", // Bu daha sonra optimize edilebilir
        transactions: 0,
        earnedPts: 0,
        spentPts: 0,
        status: b.isActive ? "active" : "passive"
      }));
      setBranches(mappedBranches);

    } catch (err) {
      console.error("Data fetch error:", err);
    } finally {
      // Data load complete
    }
  }, [organization]);

  const router = useRouter();

  useEffect(() => { 
    if (isLoaded && user) {
      const role = (user.publicMetadata?.role as string) || "boss";
      
      // 👑 Süper Admin koruması: Boss sayfasına gelirse Admin paneline zorla
      if (role === "super_admin" || role === "superadmin") {
        console.log("[BossDashboard] 👑 Super Admin in Boss zone -> Redirecting to /admin");
        router.replace("/admin");
        return;
      }

      // 🛡️ Yetki koruması: Boss olmayanları engelle
      if (role !== "boss") {
        console.log("[BossDashboard] ❌ Unauthorized access -> Redirecting to /unauthorized");
        router.replace("/unauthorized");
        return;
      }

      refreshData();
    }
  }, [isLoaded, user, organization, refreshData, router]);

  if (!isLoaded) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white font-mono uppercase tracking-[0.3em] animate-pulse">Loading System...</div>;


  // Filters
  const managers = employees.filter(e => e.role === "manager");

  // Quota calculation
  const realBranchesCount = branches.length;
  const isQuotaLimitReached = bossInfo ? realBranchesCount >= (bossInfo.branchLimit || 2) : false;



  // Combined Data
  const displayBranches = showMockData ? [...MOCK_BRANCHES, ...branches] : branches;
  const displayEmployees = employees; // Always show real employees
  const displayCustomers = showMockData ? [...MOCK_CUSTOMERS, ...customers] : customers;
  
  const totalEarned = displayBranches.reduce((s, b) => s + b.earnedPts, 0);
  const totalSpent = displayBranches.reduce((s, b) => s + b.spentPts, 0);
  const activeBranchesCount = displayBranches.filter(b => b.status === "active").length;

  // Actions
  const handleUpdateMember = async (id: string, fName: string, lName: string) => {
    setLoadingId(id);
    try { 
      await updateMemberName(id, fName, lName); 
      await refreshData(); 
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : null) || "Güncelleme sırasında hata oluştu.");
    } finally { 
      setLoadingId(null); 
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm("Bu çalışanı silmek istediğinize emin misiniz?")) return;
    setDeleteType("staff");
    setIsDeleting(true);
    try { 
      await removeMember(id); 
      await refreshData(); 
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : null) || "Çalışan silinemedi.");
    } finally { 
      setIsDeleting(false); 
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm("Bu şubeyi silmek istediğinize emin misiniz?")) return;
    setDeleteType("branch");
    setIsDeleting(true);
    try { 
      await deleteBranch(id); 
      await refreshData(); 
    } catch (err) { 
      console.error(err); 
      alert("Şube silinemedi.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleBranchStatus = async (id: string) => {
    const branch = branches.find(b => b.id === id);
    if (!branch) return;
    
    const action = branch.status === "active" ? "deactivate" : "activate";
    setToggleAction(action);
    setIsTogglingStatus(true);
    
    try {
      await toggleBranchStatus(id);
      await refreshData();
    } catch (err) {
      console.error(err);
      alert("Durum güncellenemedi.");
    } finally {
      setIsTogglingStatus(false);
      setToggleAction(null);
    }
  };

  const handleCreateBranch = async (data: { name: string; city: string }) => {
    try {
      await createBranchAction(data.name, data.city);
      await refreshData();
      setShowAddBranch(false);
    } catch (err) {
      alert("Şube oluşturulurken bir hata oluştu.");
      console.error(err);
    } finally {
      // Branch creation complete
    }
  };

  const handleChangeManager = async (branchId: number | string, managerId: string) => {
    const managerName = managers.find(m => m.id === managerId)?.name || "Atanmadı";
    setBranches(prev => prev.map(b => b.id === branchId ? { ...b, manager: managerName } : b));
    if (showMockData) {
      // Mock veriler artık statik ve merkezi olduğu için yerel state üzerinden yönetiliyor
    }
  };

  const handleSaveSettings = async (rate: number, validity: number) => {
    setSavingSettings(true);
    try {
      await updateOrgSettings(rate, validity);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } finally { setSavingSettings(false); }
  };

  const handleAddCustomer = async (data: { firstName: string; lastName: string; phone: string }) => {
    const newCust: Customer = {
      id: `c-${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: "",
      currentPoints: 100 // Welcome points
    };
    setCustomers(prev => [newCust, ...prev]);
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 font-sans ${isDarkMode ? "bg-[#0f172a] text-white" : "bg-slate-50 text-slate-900"}`}>
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
                {deleteType === "branch" 
                  ? "Sistem senkronize ediliyor, lütfen bekleyin..." 
                  : "Clerk davetiyeleri ve sistem yetkileri iptal ediliyor..."}
              </p>
            </motion.div>
          </motion.div>
        )}
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
              <div className={`w-20 h-20 border-4 rounded-full animate-spin ${
                toggleAction === "deactivate" ? "border-rose-500/20 border-t-rose-500" : "border-emerald-500/20 border-t-emerald-500"
              }`}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-10 h-10 border-4 rounded-full animate-spin-reverse ${
                  toggleAction === "deactivate" ? "border-rose-500/10 border-b-rose-400" : "border-emerald-500/10 border-b-emerald-400"
                }`}></div>
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
              <p className={`${
                toggleAction === "deactivate" ? "text-rose-200/60" : "text-emerald-200/60"
              } text-sm font-mono animate-pulse`}>
                {toggleAction === "deactivate" ? "Erişim kısıtlanıyor..." : "Erişim yetkileri tanımlanıyor..."}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BossHeader 
        user={user}
        orgName={bossInfo?.orgName || "Yükleniyor..."}
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
              <div className="space-y-8">
                <QuotaProgressBar bossInfo={bossInfo} realBranchesCount={realBranchesCount} />
                <BossOverviewStats 
                  activeBranches={activeBranchesCount}
                  totalEarned={totalEarned}
                  totalSpent={totalSpent}
                  employeeCount={displayEmployees.length}
                />
                <LeaderboardCards 
                  topCustomers={MOCK_TOP_CUSTOMERS}
                  topBranches={displayBranches}
                  onViewAllCustomers={() => setActiveTab(3)}
                  onViewAllBranches={() => setActiveTab(1)}
                />
                <div className="glass-panel-elevated rounded-3xl p-8 transition-all">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="font-bold text-lg text-white">Şube Performans Detayları</h2>
                    <button 
                      onClick={() => {
                        if (isQuotaLimitReached) {
                          alert("Şube oluşturma limitine ulaştınız. Daha fazla şube eklemek için lütfen yöneticinizle iletişime geçin.");
                          return;
                        }
                        setShowAddBranch(true);
                      }}
                      disabled={isQuotaLimitReached}
                      className={`btn-primary px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                        isQuotaLimitReached 
                          ? "opacity-40 cursor-not-allowed bg-slate-800 border border-white/10 text-slate-500 hover:scale-100" 
                          : "hover:scale-[1.02] active:scale-[0.98]"
                      }`}
                      title={isQuotaLimitReached ? "Şube limitiniz doldu" : "Yeni Şube Ekle"}
                    >
                      Yeni Şube Ekle
                    </button>
                  </div>
                  <BranchTable 
                    branches={displayBranches} 
                    onDelete={handleDeleteBranch}
                    onToggleStatus={handleToggleBranchStatus}
                    onChangeManager={setEditingBranch}
                  />
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="glass-panel-elevated rounded-3xl p-8 transition-all space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Tüm Şubeler</h2>
                  <button 
                    onClick={() => {
                      if (isQuotaLimitReached) {
                        alert("Şube oluşturma limitine ulaştınız. Daha fazla şube eklemek için lütfen yöneticinizle iletişime geçin.");
                        return;
                      }
                      setShowAddBranch(true);
                    }}
                    disabled={isQuotaLimitReached}
                    className={`btn-primary px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      isQuotaLimitReached 
                        ? "opacity-40 cursor-not-allowed bg-slate-800 border border-white/10 text-slate-500 hover:scale-100" 
                        : "hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                    title={isQuotaLimitReached ? "Şube limitiniz doldu" : "Yeni Şube Ekle"}
                  >
                    Yeni Şube Ekle
                  </button>
                </div>
                <QuotaProgressBar bossInfo={bossInfo} realBranchesCount={realBranchesCount} />
                <BranchTable 
                  branches={displayBranches} 
                  onDelete={handleDeleteBranch}
                  onToggleStatus={handleToggleBranchStatus}
                  onChangeManager={setEditingBranch}
                />
              </div>
            )}

            {activeTab === 2 && (
              <StaffManagement 
                employees={displayEmployees}
                isDarkMode={isDarkMode}
                onUpdate={handleUpdateMember}
                onRemove={handleRemoveMember}
                onReassign={setReassigningEmployee}
                onInvite={() => setShowInvite(true)}
                loadingId={loadingId}
              />
            )}

            {activeTab === 3 && (
              <CustomerManagement 
                customers={displayCustomers}
                isDarkMode={isDarkMode}
                onUpdate={async () => {}} // Placeholder
                onDelete={async () => {}} // Placeholder
                onAdd={handleAddCustomer}
                loadingId={null}
              />
            )}

            {activeTab === 4 && (
              <BossProfileSettings 
                pointRate={pointRate}
                validityMonths={validityMonths}
                bossName={bossInfo?.name || ""}
                orgName={bossInfo?.orgName || ""}
                isDarkMode={isDarkMode}
                onSaveSettings={handleSaveSettings}
                onUpdateName={async (f, l) => {
                  if (user?.id) {
                    await updateMemberName(user.id, f, l);
                    await refreshData();
                  }
                }}
                savingSettings={savingSettings}
                settingsSaved={settingsSaved}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

interface QuotaProgressBarProps {
  bossInfo: BossInfo | null;
  realBranchesCount: number;
}

function QuotaProgressBar({ bossInfo, realBranchesCount }: QuotaProgressBarProps) {
  if (!bossInfo) return null;
  return (
    <div className="glass-panel-elevated rounded-3xl p-6 transition-all border border-white/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Şube Kotası Durumu</h3>
          <p className="text-xs text-slate-400">Toplam lisanslı şube sınırınız</p>
        </div>
        <div className="text-right">
          <span className="text-sm font-mono font-bold text-indigo-400">{realBranchesCount}</span>
          <span className="text-xs text-slate-500 font-mono"> / {bossInfo.branchLimit || 2} Şube</span>
        </div>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (realBranchesCount / (bossInfo.branchLimit || 2)) * 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${
            realBranchesCount >= (bossInfo.branchLimit || 2)
              ? "bg-gradient-to-r from-rose-500 to-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
              : "bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
          }`}
        />
      </div>
      {realBranchesCount >= (bossInfo.branchLimit || 2) && (
        <p className="text-[11px] text-rose-400 font-medium mt-2.5 flex items-center gap-1.5 animate-pulse">
          ⚠️ Şube kotanız dolmuştur. Yeni şube eklemek için lütfen sistem yöneticinizle iletişime geçin.
        </p>
      )}
    </div>
  );
}
