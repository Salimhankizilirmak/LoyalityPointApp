"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Plus, Building2, Users, TrendingUp, Server, Globe, Database, Activity
} from "lucide-react";
import { OrgTable } from "@/components/features/super-admin/OrgTable";
import { ActivityLog } from "@/components/features/super-admin/ActivityLog";
import { InviteBossModal } from "@/components/features/super-admin/InviteBossModal";
import { DashboardHeader } from "../../components/features/super-admin/DashboardHeader";
import { StatCard } from "../../components/features/super-admin/StatCard";
import { SystemHealth } from "../../components/features/super-admin/SystemHealth";
import { getAllOrganizations, toggleOrgStatus, getInvitedBosses } from "./actions";
import { useClerk, useUser } from "@clerk/nextjs";
import { Organization, ActivityLogItem, InvitedBoss } from "../../components/features/super-admin/types";
import { InvitedBossesList } from "@/components/features/super-admin/InvitedBossesList";

// ── Mock data for aesthetic fallback ──────────────────────────────────────────
const MOCK_ORGS: Organization[] = [
  { id: "mock-1", name: "Migros Ticaret A.Ş.", slug: "migros", email: "cto@migros.com.tr", branches: 312, created: "2023-03-12", status: "active", customers: 148200, txVolume: 4820000 },
  { id: "mock-2", name: "CarrefourSA", slug: "carrefoursa", email: "admin@carrefour.com.tr", branches: 87, created: "2023-07-01", status: "active", customers: 62400, txVolume: 1940000 },
];

const INITIAL_LOGS: ActivityLogItem[] = [
  { id: 1, type: "success", msg: "Yeni Patron davet edildi", time: "14:32:01", actor: "super-admin" },
  { id: 2, type: "warn", msg: "Sistem heartbeat kontrolü geçti", time: "14:29:47", actor: "health-checker" },
];

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);
const fmtTL = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);

export default function SuperAdminDashboard() {
  const [showMockData, setShowMockData] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [realOrgs, setRealOrgs] = useState<Organization[]>([]);
  const [invitedBosses, setInvitedBosses] = useState<InvitedBoss[]>([]);
  const [logs, setLogs] = useState<ActivityLogItem[]>(INITIAL_LOGS);
  const [showInvite, setShowInvite] = useState(false);

  const { signOut } = useClerk();
  const { user } = useUser();

  const loadData = async () => {
    try {
      const [orgsData, bossesData] = await Promise.all([
        getAllOrganizations(),
        getInvitedBosses()
      ]);
      
      const formatted: Organization[] = orgsData.map(o => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        email: o.bossEmail,
        branches: 0,
        created: o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : "---",
        status: o.isActive ? "active" : "inactive",
        customers: 0,
        txVolume: 0
      }));
      setRealOrgs(formatted);
      setInvitedBosses(bossesData as InvitedBoss[]);
    } catch (err) {
      console.error("Load data error:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const result = await toggleOrgStatus(id, currentStatus);
    if (result.success) {
      loadData();
    }
  };

  const orgs = showMockData ? [...MOCK_ORGS, ...realOrgs] : realOrgs;

  const totalCustomers = orgs.reduce((s, o) => s + o.customers, 0);
  const totalVolume = orgs.reduce((s, o) => s + o.txVolume, 0);
  const activeOrgsCount = orgs.filter(o => o.status === "active").length;

  const STAT_CARDS_DATA = [
    { icon: Building2, label: "Toplam Organizasyon", value: String(orgs.length), sub: `${activeOrgsCount} aktif · ${orgs.length - activeOrgsCount} pasif`, accent: "#22d3ee" },
    { icon: Users, label: "Toplam Müşteri", value: fmt(totalCustomers), sub: "Tüm tenantlar", accent: "#818cf8" },
    { icon: TrendingUp, label: "İşlem Hacmi", value: fmtTL(totalVolume), sub: "Tüm şubeler", accent: "#34d399" },
    { icon: Server, label: "Sistem Durumu", value: "Stabil", sub: "Son 30 gün uptime %99.9", accent: "#f59e0b" },
  ];

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 font-sans ${isDarkMode ? "bg-[#020817] text-white" : "bg-slate-50 text-slate-900"}`}>
      <AnimatePresence>
        {showInvite && (
          <InviteBossModal 
            onClose={() => setShowInvite(false)} 
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
        signOut={() => signOut({ redirectUrl: "/" })}
      />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-px h-4" style={{ background: "#22d3ee" }} />
              <span className="text-cyan-500 text-xs font-semibold uppercase tracking-widest font-mono">System Core</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Global Kontrol Paneli</h1>
            <p className="text-slate-500 text-sm mt-1">Sistem genelindeki patronları ve organizasyonları yönetin</p>
          </div>
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold self-start sm:self-auto transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#0e7490,#22d3ee)", color: "#0a0f1e", boxShadow: "0 4px 20px rgba(34,211,238,0.25)" }}>
            <Plus size={15} />Patron Davet Et
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS_DATA.map((card, i) => (
            <StatCard key={card.label} {...card} delay={i * 0.07} />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <OrgTable orgs={orgs} onToggle={handleToggle} />
          </div>
          <div className="space-y-5">
            <ActivityLog logs={logs} />
            <InvitedBossesList bosses={invitedBosses} isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>
    </div>
  );
}
