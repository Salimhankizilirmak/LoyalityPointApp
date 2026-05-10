"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, Star, Award, Store, BarChart3, Bell, ChevronRight,
  LogOut, Plus, Save, X
} from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { BranchTable } from "@/components/features/boss-dashboard/BranchTable";
import { InviteModal } from "@/components/features/boss-dashboard/InviteModal";
import { getBossProfile, updateOrgSettings, createBranch, getOrgMembers } from "./actions";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: "boss" | "manager" | "cashier";
  avatar: string;
  status: "active" | "pending";
  createdAt?: number;
}

interface Branch {
  id: number;
  name: string;
  city: string;
  manager: string;
  transactions: number;
  earnedPts: number;
  spentPts: number;
  status: "active" | "inactive";
}

const INITIAL_BRANCHES: Branch[] = [
  { id: 1, name: "İstanbul Cevahir AVM", city: "İstanbul", manager: "Selin Öztürk", transactions: 4820, earnedPts: 148200, spentPts: 62400, status: "active" },
  { id: 2, name: "Ankara Ankamall", city: "Ankara", manager: "Kemal Arslan", transactions: 3210, earnedPts: 97800, spentPts: 41200, status: "active" },
  { id: 3, name: "İzmir Forum AVM", city: "İzmir", manager: "Deniz Kara", transactions: 2940, earnedPts: 88500, spentPts: 37900, status: "active" },
  { id: 4, name: "Bursa Korupark", city: "Bursa", manager: "Ayhan Çelik", transactions: 1870, earnedPts: 54300, spentPts: 21800, status: "active" },
  { id: 5, name: "Antalya MarkAntalya", city: "Antalya", manager: "Hande Yıldız", transactions: 1540, earnedPts: 43200, spentPts: 18600, status: "active" },
  { id: 6, name: "Adana Optimum", city: "Adana", manager: "Murat Doğan", transactions: 890, earnedPts: 24700, spentPts: 9800, status: "inactive" },
];

const TOP_CUSTOMERS = [
  { rank: 1, name: "Fatma Güler", phone: "0532 *** **11", earned: 18420, spent: 9200, level: "Platinum" },
  { rank: 2, name: "Mehmet Koç", phone: "0541 *** **72", earned: 14880, spent: 7400, level: "Gold" },
  { rank: 3, name: "Zeynep Aydın", phone: "0555 *** **43", earned: 12310, spent: 5100, level: "Gold" },
];

const TABS = ["Genel Bakış", "Şubeler", "Çalışanlar", "Müşteriler", "Profil"];
const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

export default function BossDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [showInvite, setShowInvite] = useState(false);
  const [empFilter, setEmpFilter] = useState("all");
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchCity, setNewBranchCity] = useState("");
  const [addingBranch, setAddingBranch] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmps, setLoadingEmps] = useState(true);

  // Profil state
  const [pointRate, setPointRate] = useState(10);
  const [validityMonths, setValidityMonths] = useState(12);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [bossInfo, setBossInfo] = useState<{ name: string; email: string; orgName: string } | null>(null);

  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();

  // Patron bilgilerini yükle
  useEffect(() => {
    getBossProfile()
      .then((data) => {
        setBossInfo({
          name: `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim(),
          email: data.user.email,
          orgName: data.org.name,
        });
        setPointRate(data.org.pointRate);
        setValidityMonths(data.org.validityMonths);
      })
      .catch(() => {
        if (user) {
          setBossInfo({
            name: user.fullName || "Patron",
            email: user.primaryEmailAddress?.emailAddress || "",
            orgName: "Organizasyon",
          });
        }
      });

    // Çalışanları yükle
    getOrgMembers()
      .then(setEmployees)
      .catch(() => {})
      .finally(() => setLoadingEmps(false));
  }, [user]);

  const handleSignOut = () => {
    signOut({ redirectUrl: "/" });
  };

  const handleAddBranch = async () => {
    if (!newBranchName || !newBranchCity) return;
    setAddingBranch(true);
    try {
      await createBranch(newBranchName, newBranchCity);
      const newId = Math.max(...branches.map(b => b.id)) + 1;
      setBranches(prev => [...prev, {
        id: newId,
        name: newBranchName,
        city: newBranchCity,
        manager: "-",
        transactions: 0,
        earnedPts: 0,
        spentPts: 0,
        status: "active" as const,
      }]);
      setNewBranchName("");
      setNewBranchCity("");
      setShowAddBranch(false);
    } catch {
      // Yine de local olarak ekle
      const newId = Math.max(...branches.map(b => b.id)) + 1;
      setBranches(prev => [...prev, {
        id: newId,
        name: newBranchName,
        city: newBranchCity,
        manager: "-",
        transactions: 0,
        earnedPts: 0,
        spentPts: 0,
        status: "active" as const,
      }]);
      setNewBranchName("");
      setNewBranchCity("");
      setShowAddBranch(false);
    } finally {
      setAddingBranch(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateOrgSettings(pointRate, validityMonths);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch {
      // silent fail
    } finally {
      setSavingSettings(false);
    }
  };

  const totalEarned = branches.reduce((s, b) => s + b.earnedPts, 0);
  const totalSpent = branches.reduce((s, b) => s + b.spentPts, 0);
  const activeBranches = branches.filter(b => b.status === "active").length;
  const maxEarned = Math.max(...branches.map(b => b.earnedPts));
  const filteredEmps = empFilter === "all"
    ? employees.filter(e => e.role !== "boss")
    : employees.filter(e => e.role === empFilter);

  const displayName = bossInfo?.name || user?.fullName || "Patron";
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen w-full" style={{ background: "#f8fafc", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      {showInvite && <InviteModal onClose={() => { setShowInvite(false); getOrgMembers().then(setEmployees).catch(() => {}); }} branches={branches} />}

      {/* Add Branch Modal */}
      {showAddBranch && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}>
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="w-full max-w-md rounded-2xl p-6 bg-white"
            style={{ boxShadow: "0 24px 64px rgba(15,23,42,0.18)" }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Store size={16} className="text-blue-700" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-semibold text-sm">Yeni Şube Ekle</h3>
                  <p className="text-slate-400 text-xs">Yeni bir şube oluşturun</p>
                </div>
              </div>
              <button onClick={() => setShowAddBranch(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100">
                <X size={14} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-slate-600 text-xs font-medium mb-1.5 block">Şube Adı</label>
                <input value={newBranchName} onChange={e => setNewBranchName(e.target.value)}
                  placeholder="Örn: İstanbul Cevahir AVM"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-900 outline-none"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }} />
              </div>
              <div>
                <label className="text-slate-600 text-xs font-medium mb-1.5 block">Şehir</label>
                <input value={newBranchCity} onChange={e => setNewBranchCity(e.target.value)}
                  placeholder="Örn: İstanbul"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-900 outline-none"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddBranch(false)} className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 font-medium"
                style={{ border: "1px solid #e2e8f0" }}>İptal</button>
              <button disabled={!newBranchName || !newBranchCity || addingBranch}
                onClick={handleAddBranch}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: newBranchName && newBranchCity ? "#1e3a8a" : "#cbd5e1" }}>
                {addingBranch ? "Ekleniyor..." : "Şube Ekle"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Top Bar */}
      <div className="bg-white sticky top-0 z-20" style={{ borderBottom: "1px solid #f1f5f9" }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white" style={{ background: "#1e3a8a" }}>
              {bossInfo?.orgName?.charAt(0)?.toUpperCase() || "LC"}
            </div>
            <div className="hidden sm:block">
              <p className="text-slate-900 font-bold text-sm leading-none">{bossInfo?.orgName || "Organizasyon"}</p>
              <p className="text-slate-400 text-xs">Organizasyon Paneli</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map((tab, i) => (
              <button key={tab} onClick={() => setActiveTab(i)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
                style={{ background: activeTab === i ? "#eff6ff" : "transparent", color: activeTab === i ? "#1e40af" : "#64748b" }}>
                {tab}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 flex items-center justify-center rounded-lg" style={{ border: "1px solid #f1f5f9" }}>
              <Bell size={14} className="text-slate-400" />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ border: "1px solid #f1f5f9" }}>
              <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center">
                <span className="text-blue-700 text-xs font-bold">{displayInitial}</span>
              </div>
              <span className="text-slate-600 text-xs hidden sm:block font-medium">{displayName}</span>
            </div>
            <button onClick={handleSignOut}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
              style={{ border: "1px solid #f1f5f9" }}
              title="Çıkış Yap">
              <LogOut size={14} className="text-slate-400 hover:text-red-500" />
            </button>
          </div>
        </div>
        {/* Mobile tabs */}
        <div className="md:hidden flex overflow-x-auto px-4 pb-0 gap-1">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className="px-3 py-2 text-xs font-medium whitespace-nowrap flex-shrink-0"
              style={{ borderBottom: activeTab === i ? "2px solid #1e40af" : "2px solid transparent", color: activeTab === i ? "#1e40af" : "#94a3b8" }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

          {/* Genel Bakış */}
          {activeTab === 0 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-slate-900 font-bold text-xl">Genel Bakış</h1>
                <p className="text-slate-500 text-sm mt-0.5">{bossInfo?.orgName || "Organizasyon"} tüm şubeler</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Users, label: "Toplam Müşteri", value: fmt(68420), color: "#1e40af", delta: 7 },
                  { icon: Star, label: "Dağıtılan Puan", value: fmt(totalEarned), color: "#7c3aed", delta: 12 },
                  { icon: Award, label: "Kullanılan Puan", value: fmt(totalSpent), color: "#b45309", delta: -3 },
                  { icon: Store, label: "Aktif Şube", value: String(activeBranches), color: "#059669" },
                ].map(({ icon: Icon, label, value, color, delta }, i) => (
                  <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="rounded-2xl p-5 bg-white" style={{ border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                        <Icon size={18} style={{ color }} />
                      </div>
                      {delta !== undefined && (
                        <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
                          style={{ background: delta >= 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", color: delta >= 0 ? "#059669" : "#dc2626" }}>
                          {delta >= 0 ? "↑" : "↓"}{Math.abs(delta)}%
                        </div>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
                    <p className="text-slate-500 text-xs font-medium">{label}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white rounded-2xl p-5" style={{ border: "1px solid #f1f5f9" }}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-slate-800 font-semibold text-sm">Şube Performansı</h2>
                      <p className="text-slate-400 text-xs mt-0.5">Kazanılan puana göre</p>
                    </div>
                    <BarChart3 size={16} className="text-slate-300" />
                  </div>
                  <div className="space-y-3">
                    {branches.filter(b => b.earnedPts > 0).slice(0, 5).map((b, i) => (
                      <motion.div key={b.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-xs font-mono w-4">{i + 1}</span>
                            <span className="text-slate-700 text-xs font-medium truncate" style={{ maxWidth: 160 }}>{b.name}</span>
                          </div>
                          <span className="text-slate-900 text-xs font-semibold">{fmt(b.earnedPts)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(b.earnedPts / maxEarned) * 100}%` }}
                            transition={{ duration: 1, delay: i * 0.08, ease: "easeOut" }}
                            className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#1e3a8a,#3b82f6)" }} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #f1f5f9" }}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-slate-800 font-semibold text-sm">En Sadık Müşteriler</h2>
                    <button onClick={() => setActiveTab(3)} className="text-blue-600 text-xs font-medium flex items-center gap-1">
                      Tümü <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {TOP_CUSTOMERS.map(c => (
                      <div key={c.rank} className="flex items-center gap-2.5">
                        <span className="text-slate-300 text-xs font-mono w-3">{c.rank}</span>
                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                          {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-700 text-xs font-medium truncate">{c.name}</p>
                        </div>
                        <span className="text-emerald-600 text-xs font-semibold">{fmt(c.earned)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Şubeler */}
          {activeTab === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-slate-900 font-bold text-xl">Şube Analizi</h1>
                <button onClick={() => setShowAddBranch(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white"
                  style={{ background: "#1e3a8a" }}>
                  <Plus size={14} />
                  Yeni Şube Ekle
                </button>
              </div>
              <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #f1f5f9" }}>
                <BranchTable branches={branches} />
              </div>
            </div>
          )}

          {/* Çalışanlar */}
          {activeTab === 2 && (
            <div className="space-y-5">
              <h1 className="text-slate-900 font-bold text-xl">Çalışan Yönetimi</h1>
              <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #f1f5f9" }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex gap-2">
                    {[["all", "Tümü"], ["manager", "Müdürler"], ["cashier", "Kasiyerler"]].map(([val, label]) => (
                      <button key={val} onClick={() => setEmpFilter(val)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{ background: empFilter === val ? "#1e3a8a" : "#f8fafc", color: empFilter === val ? "#fff" : "#64748b", border: empFilter === val ? "none" : "1px solid #e2e8f0" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowInvite(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white"
                    style={{ background: "#1e3a8a" }}>
                    Yeni Yönetici Davet Et
                  </button>
                </div>
                <div className="space-y-2">
                  {loadingEmps ? (
                    <div className="text-center py-8">
                      <p className="text-slate-400 text-sm">Çalışanlar yükleniyor...</p>
                    </div>
                  ) : filteredEmps.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-400 text-sm">Henüz çalışan bulunmuyor</p>
                    </div>
                  ) : (
                    filteredEmps.map((emp, i) => (
                      <motion.div key={emp.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-slate-50 transition-colors"
                        style={{ border: "1px solid #f1f5f9", opacity: emp.status === "pending" ? 0.7 : 1 }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: emp.role === "manager" ? "#eff6ff" : "#f0fdf4", color: emp.role === "manager" ? "#1e40af" : "#15803d" }}>
                          {emp.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 text-sm font-medium">{emp.name}</p>
                          <p className="text-slate-400 text-xs">{emp.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {emp.status === "pending" && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: "#fef3c7", color: "#92400e" }}>
                              Bekliyor
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: emp.role === "manager" ? "#eff6ff" : "#f0fdf4", color: emp.role === "manager" ? "#1e40af" : "#15803d" }}>
                            {emp.role === "manager" ? "Müdür" : "Kasiyer"}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Müşteriler */}
          {activeTab === 3 && (
            <div className="space-y-5">
              <h1 className="text-slate-900 font-bold text-xl">En Sadık Müşteriler</h1>
              <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #f1f5f9" }}>
                {TOP_CUSTOMERS.map((c, i) => (
                  <motion.div key={c.rank} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 p-3.5 rounded-xl mb-2"
                    style={{ border: "1px solid #f1f5f9", background: i === 0 ? "#fffbeb" : "#fff" }}>
                    <span className="text-slate-400 text-xs w-5 font-mono">{c.rank}</span>
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-600">
                      {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-800 text-sm font-medium">{c.name}</p>
                      <p className="text-slate-400 text-xs">{c.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-600 text-xs font-semibold">+{fmt(c.earned)}</p>
                      <p className="text-amber-500 text-xs">-{fmt(c.spent)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Profil */}
          {activeTab === 4 && (
            <div className="space-y-5">
              <h1 className="text-slate-900 font-bold text-xl">Organizasyon Profili</h1>
              <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #f1f5f9" }}>
                <div className="flex items-center gap-4 p-5 rounded-2xl mb-5" style={{ border: "1px solid #f1f5f9" }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#1e3a8a,#3b82f6)" }}>
                    {bossInfo?.orgName?.charAt(0)?.toUpperCase() || "O"}
                  </div>
                  <div>
                    <h2 className="text-slate-900 font-bold text-lg">{bossInfo?.orgName || "Organizasyon"}</h2>
                    <p className="text-slate-500 text-sm">{bossInfo?.email || ""}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-emerald-600 text-xs font-medium">Aktif</span>
                    </div>
                  </div>
                </div>

                {/* Patron Bilgileri */}
                <div className="mb-5">
                  <h3 className="text-slate-700 font-semibold text-sm mb-3">Patron Bilgileri</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white" style={{ border: "1px solid #f1f5f9" }}>
                      <p className="text-slate-400 text-xs mb-1">Ad Soyad</p>
                      <p className="text-slate-800 text-sm font-medium">{bossInfo?.name || "-"}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white" style={{ border: "1px solid #f1f5f9" }}>
                      <p className="text-slate-400 text-xs mb-1">E-posta</p>
                      <p className="text-slate-800 text-sm font-medium">{bossInfo?.email || "-"}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white" style={{ border: "1px solid #f1f5f9" }}>
                      <p className="text-slate-400 text-xs mb-1">Organizasyon</p>
                      <p className="text-slate-800 text-sm font-medium">{bossInfo?.orgName || "-"}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white" style={{ border: "1px solid #f1f5f9" }}>
                      <p className="text-slate-400 text-xs mb-1">Rol</p>
                      <p className="text-slate-800 text-sm font-medium">Patron (Admin)</p>
                    </div>
                  </div>
                </div>

                {/* Düzenlenebilir Ayarlar */}
                <div>
                  <h3 className="text-slate-700 font-semibold text-sm mb-3">Puan Ayarları</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="p-4 rounded-xl bg-white" style={{ border: "1px solid #f1f5f9" }}>
                      <label className="text-slate-400 text-xs mb-2 block">Puan Kazanma Oranı (%)</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={pointRate}
                        onChange={e => setPointRate(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg text-sm text-slate-900 font-medium outline-none"
                        style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                      />
                      <p className="text-slate-400 text-xs mt-1.5">Her alışverişten kazanılacak puan yüzdesi</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white" style={{ border: "1px solid #f1f5f9" }}>
                      <label className="text-slate-400 text-xs mb-2 block">Puan Geçerlilik Süresi (Ay)</label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={validityMonths}
                        onChange={e => setValidityMonths(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg text-sm text-slate-900 font-medium outline-none"
                        style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                      />
                      <p className="text-slate-400 text-xs mt-1.5">Puanların geçerli kalacağı süre</p>
                    </div>
                  </div>
                  <button onClick={handleSaveSettings} disabled={savingSettings}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{ background: settingsSaved ? "#059669" : "#1e3a8a" }}>
                    <Save size={14} />
                    {savingSettings ? "Kaydediliyor..." : settingsSaved ? "Kaydedildi!" : "Ayarları Kaydet"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
