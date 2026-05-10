"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Plus, Building2, Users, TrendingUp, Server, Globe, Database, Activity
} from "lucide-react";
import { OrgTable } from "@/components/features/super-admin/OrgTable";
import { ActivityLog } from "@/components/features/super-admin/ActivityLog";
import { AddOrgModal } from "@/components/features/super-admin/AddOrgModal";
import { DashboardHeader } from "../../components/features/super-admin/DashboardHeader";
import { StatCard } from "../../components/features/super-admin/StatCard";
import { SystemHealth } from "../../components/features/super-admin/SystemHealth";
import { getAllOrganizations } from "./actions";
import { useClerk, useUser } from "@clerk/nextjs";
import { Organization, ActivityLogItem } from "../../components/features/super-admin/types";

// ── Static data ─────────────────────────────────────────────────────────────
const INITIAL_ORGS: Organization[] = [
  { id: 1, name: "Migros Ticaret A.Ş.", slug: "migros", email: "cto@migros.com.tr", branches: 312, created: "2023-03-12", status: "active", customers: 148200, txVolume: 4820000 },
  { id: 2, name: "CarrefourSA", slug: "carrefoursa", email: "admin@carrefour.com.tr", branches: 87, created: "2023-07-01", status: "active", customers: 62400, txVolume: 1940000 },
  { id: 3, name: "BIM Birleşik Mağazalar", slug: "bim", email: "ops@bim.com.tr", branches: 540, created: "2024-01-15", status: "active", customers: 310500, txVolume: 7200000 },
  { id: 4, name: "Teknosa", slug: "teknosa", email: "tech@teknosa.com", branches: 43, created: "2024-02-28", status: "inactive", customers: 18700, txVolume: 0 },
  { id: 5, name: "Gratis Kozmetik", slug: "gratis", email: "dev@gratis.com.tr", branches: 128, created: "2024-05-10", status: "active", customers: 89300, txVolume: 2100000 },
  { id: 6, name: "Boyner Büyük Mağaza", slug: "boyner", email: "admin@boyner.com", branches: 61, created: "2024-09-03", status: "active", customers: 44100, txVolume: 980000 },
];

const INITIAL_LOGS: ActivityLogItem[] = [
  { id: 1, type: "success", msg: "BIM organizasyonu sisteme eklendi", time: "14:32:01", actor: "system@core.io" },
  { id: 2, type: "warn", msg: "Teknosa — başarısız giriş denemesi (3x)", time: "14:29:47", actor: "login-guard" },
  { id: 3, type: "info", msg: "Migros kasiyer şifre sıfırladı", time: "14:21:03", actor: "auth-service" },
  { id: 4, type: "success", msg: "Gratis — 128 şube senkronizasyonu tamamlandı", time: "14:18:55", actor: "sync-worker" },
  { id: 5, type: "error", msg: "CarrefourSA API rate limit aşıldı (429)", time: "14:11:22", actor: "api-gateway" },
];

const LIVE_MSGS = [
  { type: "info" as const, msg: "Sistem heartbeat kontrolü geçti", actor: "health-checker" },
  { type: "success" as const, msg: "Gratis — yeni müşteri kaydı: +47", actor: "event-bus" },
  { type: "info" as const, msg: "Migros API token yenilendi", actor: "token-rotator" },
  { type: "warn" as const, msg: "BIM şube #204 son 5dk'dır çevrimdışı", actor: "monitor" },
];

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);
const fmtTL = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);

export default function SuperAdminDashboard() {
  const [showMockData, setShowMockData] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark for Super Admin
  const [realOrgs, setRealOrgs] = useState<Organization[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>(INITIAL_ORGS);
  const [logs, setLogs] = useState<ActivityLogItem[]>(INITIAL_LOGS);
  const [showAdd, setShowAdd] = useState(false);

  const { signOut } = useClerk();
  const { user } = useUser();

  useEffect(() => {
    getAllOrganizations().then(data => {
      const formatted: Organization[] = data.map(o => ({
        id: o.id as unknown as number,
        name: o.name,
        slug: o.slug,
        email: o.bossEmail,
        branches: 1,
        created: new Date().toISOString().split("T")[0],
        status: "active",
        customers: 0,
        txVolume: 0
      }));
      setRealOrgs(formatted);
    });
  }, []);

  useEffect(() => {
    if (showMockData) {
      setOrgs([...INITIAL_ORGS, ...realOrgs]);
    } else {
      setOrgs(realOrgs);
    }
  }, [showMockData, realOrgs]);

  useEffect(() => {
    const interval = setInterval(() => {
      const m = LIVE_MSGS[Math.floor(Math.random() * LIVE_MSGS.length)];
      const now = new Date();
      const time = now.toLocaleTimeString("tr-TR", { hour12: false });
      setLogs(prev => [{ id: Date.now(), ...m, time }, ...prev.slice(0, 29)]);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const toggleOrg = (id: string | number) =>
    setOrgs(prev => prev.map(o => o.id === id ? { ...o, status: o.status === "active" ? "inactive" : "active" } : o));

  const addOrg = (form: { name: string; slug: string; email: string }) => {
    const newOrg: Organization = { id: Date.now(), name: form.name, slug: form.slug, email: form.email, branches: 0, created: new Date().toISOString().split("T")[0], status: "active", customers: 0, txVolume: 0 };
    setRealOrgs(prev => [newOrg, ...prev]);
    if (showMockData) {
      setLogs(prev => [{ id: Date.now(), type: "success", msg: `${form.name} sisteme eklendi`, time: new Date().toLocaleTimeString("tr-TR"), actor: "super-admin" }, ...prev]);
    }
  };

  const totalCustomers = orgs.reduce((s, o) => s + o.customers, 0);
  const totalVolume = orgs.reduce((s, o) => s + o.txVolume, 0);
  const activeOrgsCount = orgs.filter(o => o.status === "active").length;

  const STAT_CARDS_DATA = [
    { icon: Building2, label: "Toplam Organizasyon", value: String(orgs.length), sub: `${activeOrgsCount} aktif · ${orgs.length - activeOrgsCount} pasif`, accent: "#22d3ee", delta: showMockData ? 12 : undefined },
    { icon: Users, label: "Toplam Aktif Müşteri", value: fmt(totalCustomers), sub: "Tüm tenantlar", accent: "#818cf8", delta: showMockData ? 8 : undefined },
    { icon: TrendingUp, label: "Günlük İşlem Hacmi", value: fmtTL(totalVolume), sub: "Bugün · Tüm şubeler", accent: "#34d399", delta: showMockData ? 3 : undefined },
    { icon: Server, label: "Sistem Uptime", value: "99.97%", sub: "Son 30 gün · 4 bölge", accent: "#f59e0b" },
  ];

  const HEALTH_BARS = [
    { label: "API Gateway", value: 94, color: "#22d3ee" },
    { label: "Database Cluster", value: 61, color: "#818cf8" },
    { label: "Cache (Redis)", value: 38, color: "#34d399" },
    { label: "Worker Queue", value: 79, color: "#f59e0b" },
  ];

  const INFRA_DATA = [
    { icon: Globe, label: "Bölge", value: "4 / 4", color: "#22d3ee" },
    { icon: Database, label: "Replica", value: "3×", color: "#818cf8" },
    { icon: Activity, label: "P99 Latency", value: "42ms", color: "#34d399" },
  ];

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 font-sans ${isDarkMode ? "bg-[#020817] text-white" : "bg-slate-50 text-slate-900"}`}>
      <AnimatePresence>
        {showAdd && (
          <AddOrgModal 
            onClose={() => setShowAdd(false)} 
            onAdd={addOrg} 
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>

      <DashboardHeader 
        user={user}
        showMockData={showMockData}
        setShowMockData={setShowMockData}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        signOut={signOut}
      />

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-px h-4" style={{ background: "#22d3ee" }} />
              <span className="text-cyan-500 text-xs font-semibold uppercase tracking-widest font-mono">System Core</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Global Kontrol Paneli</h1>
            <p className="text-slate-500 text-sm mt-1">Tüm tenant sistemleri için merkezi yönetim arayüzü</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold self-start sm:self-auto transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#0e7490,#22d3ee)", color: "#0a0f1e", boxShadow: "0 4px 20px rgba(34,211,238,0.25)" }}>
            <Plus size={15} />Yeni Organizasyon
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS_DATA.map((card, i) => (
            <StatCard key={card.label} {...card} delay={i * 0.07} />
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <OrgTable orgs={orgs} onToggle={toggleOrg} />
          </div>
          <div className="space-y-5">
            {showMockData && (
              <SystemHealth bars={HEALTH_BARS} infra={INFRA_DATA} />
            )}

            {showMockData ? (
              <ActivityLog logs={logs} />
            ) : (
              <div className="rounded-2xl p-5" style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={13} className="text-cyan-500" />
                  <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Aktivite Akışı</span>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
                    <Activity size={16} className="text-slate-600" />
                  </div>
                  <p className="text-slate-500 text-xs">Henüz gerçek bir aktivite yok</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
