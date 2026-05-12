"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClerk, useUser } from "@clerk/nextjs";
import { 
  getBossProfile, 
  updateOrgSettings, 
  createBranch, 
  getOrgMembers, 
  updateMemberName, 
  removeMember, 
  deleteOrganization,
  getAllBossOrganizations
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
import { CustomerManagement } from "@/components/features/manager-dashboard/CustomerManagement";

// Types
import { Branch, Employee, TopCustomer, BossInfo } from "@/components/features/boss-dashboard/types";
import { Customer } from "@/components/features/manager-dashboard/types";

// Mock Data
const MOCK_BRANCHES: Branch[] = [
  { id: 1, name: "İstanbul Cevahir AVM", city: "İstanbul", manager: "Selin Öztürk", transactions: 4820, earnedPts: 148200, spentPts: 62400, status: "active" },
  { id: 2, name: "Ankara Ankamall", city: "Ankara", manager: "Kemal Arslan", transactions: 3210, earnedPts: 97800, spentPts: 41200, status: "active" },
  { id: 3, name: "İzmir Forum AVM", city: "İzmir", manager: "Deniz Kara", transactions: 2940, earnedPts: 88500, spentPts: 37900, status: "active" },
];

const MOCK_TOP_CUSTOMERS: TopCustomer[] = [
  { rank: 1, name: "Fatma Güler", phone: "0532 *** **11", earned: 18420, spent: 9200, level: "Platinum" },
  { rank: 2, name: "Mehmet Koç", phone: "0541 *** **72", earned: 14880, spent: 7400, level: "Gold" },
  { rank: 3, name: "Zeynep Aydın", phone: "0555 *** **43", earned: 12310, spent: 5100, level: "Gold" },
];

const MOCK_CUSTOMERS: Customer[] = [
  { id: "c1", firstName: "Fatma", lastName: "Güler", phone: "0532 111 22 33", email: "fatma@ornek.com", currentPoints: 4820 },
  { id: "c2", firstName: "Mehmet", lastName: "Koç", phone: "0541 222 33 44", email: "mehmet@ornek.com", currentPoints: 2140 },
  { id: "c3", firstName: "Zeynep", lastName: "Aydın", phone: "0555 333 44 55", email: "zeynep@ornek.com", currentPoints: 6310 },
];

const TABS = ["Genel Bakış", "Şubeler", "Çalışanlar", "Müşteriler", "Profil"];

export default function BossDashboard() {
  const [showMockData, setShowMockData] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
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
  const [loadingEmps, setLoadingEmps] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  // Settings State
  const [pointRate, setPointRate] = useState(10);
  const [validityMonths, setValidityMonths] = useState(12);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const { signOut } = useClerk();
  const { user } = useUser();

  const refreshData = async () => {
    try {
      const [profile, emps, allOrgs] = await Promise.all([
        getBossProfile(), 
        getOrgMembers(),
        getAllBossOrganizations()
      ]);
      
      setBossInfo({
        name: `${profile.user.firstName || ""} ${profile.user.lastName || ""}`.trim(),
        email: profile.user.email,
        orgName: profile.org?.name || "Yükleniyor...",
      });

      if (profile.org) {
        setPointRate(profile.org.pointRate);
        setValidityMonths(profile.org.validityMonths);
      }

      setEmployees(emps as Employee[]);
      
      // DB'den gelen organizasyonları Branch tipine dönüştür
      const mappedBranches: Branch[] = allOrgs.map(o => ({
        id: o.id,
        name: o.name,
        city: "Atanmadı", // Şimdilik DB'de city yok
        manager: "Atanmadı", // Şube müdürü bilgisi metadata'da
        transactions: 0,
        earnedPts: 0,
        spentPts: 0,
        status: o.isActive ? "active" : "passive"
      }));
      setBranches(mappedBranches);

    } catch (err) {
      console.error("Data fetch error:", err);
      if (user) {
        setBossInfo({
          name: user.fullName || "Patron",
          email: user.primaryEmailAddress?.emailAddress || "",
          orgName: "Organizasyon",
        });
      }
    } finally {
      setLoadingEmps(false);
    }
  };

  useEffect(() => { refreshData(); }, [user]);

  // Filters
  const managers = employees.filter(e => e.role === "manager");

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
    } catch (err: any) {
      alert(err.message || "Güncelleme sırasında hata oluştu.");
    } finally { 
      setLoadingId(null); 
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm("Bu çalışanı silmek istediğinize emin misiniz?")) return;
    setLoadingId(id);
    try { await removeMember(id); await refreshData(); } finally { setLoadingId(null); }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm("Bu şubeyi silmek istediğinize emin misiniz?")) return;
    try { await deleteOrganization(id); refreshData(); } catch (err) { console.error(err); }
  };

  const handleCreateBranch = async (data: { name: string; city: string; managerId: string }) => {
    const newBranch: Branch = {
      id: Date.now(),
      name: data.name,
      city: data.city,
      manager: managers.find(m => m.id === data.managerId)?.name || "Atanmadı",
      transactions: 0,
      earnedPts: 0,
      spentPts: 0,
      status: "active"
    };
    setBranches(prev => [newBranch, ...prev]);
  };

  const handleChangeManager = async (branchId: number, managerId: string) => {
    const managerName = managers.find(m => m.id === managerId)?.name || "Atanmadı";
    setBranches(prev => prev.map(b => b.id === branchId ? { ...b, manager: managerName } : b));
    if (showMockData) {
      const idx = MOCK_BRANCHES.findIndex(b => b.id === branchId);
      if (idx !== -1) MOCK_BRANCHES[idx].manager = managerName;
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
    <div className={`min-h-screen w-full transition-colors duration-500 font-sans bg-[#13131b] text-white`}>
      <AnimatePresence>
        {showInvite && (
          <InviteModal 
            onClose={() => { setShowInvite(false); refreshData(); }} 
            branches={displayBranches} 
            isDarkMode={true}
          />
        )}
        {showAddBranch && (
          <AddBranchModal 
            onClose={() => setShowAddBranch(false)} 
            onAdd={handleCreateBranch}
            managers={managers}
            isDarkMode={true}
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
      </AnimatePresence>

      <BossHeader 
        user={user}
        orgName={bossInfo?.orgName || "Yükleniyor..."}
        showMockData={showMockData}
        setShowMockData={setShowMockData}
        isDarkMode={true}
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
                      onClick={() => setShowAddBranch(true)}
                      className="btn-primary px-6 py-3 rounded-xl text-sm font-bold"
                    >
                      Yeni Şube Ekle
                    </button>
                  </div>
                  <BranchTable 
                    branches={displayBranches} 
                    onDelete={handleDeleteBranch}
                    onChangeManager={setEditingBranch}
                  />
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="glass-panel-elevated rounded-3xl p-8 transition-all">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white">Tüm Şubeler</h2>
                  <button 
                    onClick={() => setShowAddBranch(true)}
                    className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold"
                  >
                    Yeni Şube Ekle
                  </button>
                </div>
                <BranchTable 
                  branches={displayBranches} 
                  onDelete={handleDeleteBranch}
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
