"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Users, TrendingUp, Server, Plus, Shield, Bell,
  LogOut, Cpu, Globe, Database, Activity, Layers
} from "lucide-react";
import { OrgTable } from "@/components/features/super-admin/OrgTable";
import { ActivityLog } from "@/components/features/super-admin/ActivityLog";
import { AddOrgModal } from "@/components/features/super-admin/AddOrgModal";

// ── Static data (replace with server actions as needed) ──────────────────────
const INITIAL_ORGS = [
  { id: 1, name: "Migros Ticaret A.Ş.", slug: "migros", email: "cto@migros.com.tr", branches: 312, created: "2023-03-12", status: "active" as const, customers: 148200, txVolume: 4820000 },
  { id: 2, name: "CarrefourSA", slug: "carrefoursa", email: "admin@carrefour.com.tr", branches: 87, created: "2023-07-01", status: "active" as const, customers: 62400, txVolume: 1940000 },
  { id: 3, name: "BIM Birleşik Mağazalar", slug: "bim", email: "ops@bim.com.tr", branches: 540, created: "2024-01-15", status: "active" as const, customers: 310500, txVolume: 7200000 },
  { id: 4, name: "Teknosa", slug: "teknosa", email: "tech@teknosa.com", branches: 43, created: "2024-02-28", status: "inactive" as const, customers: 18700, txVolume: 0 },
  { id: 5, name: "Gratis Kozmetik", slug: "gratis", email: "dev@gratis.com.tr", branches: 128, created: "2024-05-10", status: "active" as const, customers: 89300, txVolume: 2100000 },
  { id: 6, name: "Boyner Büyük Mağaza", slug: "boyner", email: "admin@boyner.com", branches: 61, created: "2024-09-03", status: "active" as const, customers: 44100, txVolume: 980000 },
];

const INITIAL_LOGS = [
  { id: 1, type: "success" as const, msg: "BIM organizasyonu sisteme eklendi", time: "14:32:01", actor: "system@core.io" },
  { id: 2, type: "warn" as const, msg: "Teknosa — başarısız giriş denemesi (3x)", time: "14:29:47", actor: "login-guard" },
  { id: 3, type: "info" as const, msg: "Migros kasiyer şifre sıfırladı", time: "14:21:03", actor: "auth-service" },
  { id: 4, type: "success" as const, msg: "Gratis — 128 şube senkronizasyonu tamamlandı", time: "14:18:55", actor: "sync-worker" },
  { id: 5, type: "error" as const, msg: "CarrefourSA API rate limit aşıldı (429)", time: "14:11:22", actor: "api-gateway" },
];

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);
const fmtTL = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);

const LIVE_MSGS = [
  { type: "info" as const, msg: "Sistem heartbeat kontrolü geçti", actor: "health-checker" },
  { type: "success" as const, msg: "Gratis — yeni müşteri kaydı: +47", actor: "event-bus" },
  { type: "info" as const, msg: "Migros API token yenilendi", actor: "token-rotator" },
  { type: "warn" as const, msg: "BIM şube #204 son 5dk'dır çevrimdışı", actor: "monitor" },
];

export default function SuperAdminDashboard() {
  const [orgs, setOrgs] = useState(INITIAL_ORGS);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [showAdd, setShowAdd] = useState(false);

  // Simulate live log
  useEffect(() => {
    const interval = setInterval(() => {
      const m = LIVE_MSGS[Math.floor(Math.random() * LIVE_MSGS.length)];
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      setLogs(prev => [{ id: Date.now(), ...m, time }, ...prev.slice(0, 29)]);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const toggleOrg = (id: number) =>
    setOrgs(prev => prev.map(o => o.id === id ? { ...o, status: o.status === "active" ? "inactive" : "active" } : o));

  const addOrg = (form: { name: string; slug: string; email: string }) => {
    const newOrg = { id: Date.now(), name: form.name, slug: form.slug, email: form.email, branches: 0, created: new Date().toISOString().split("T")[0], status: "active" as const, customers: 0, txVolume: 0 };
    setOrgs(prev => [newOrg, ...prev]);
    setLogs(prev => [{ id: Date.now(), type: "success", msg: `${form.name} sisteme eklendi — davet gönderildi`, time: new Date().toLocaleTimeString("tr-TR"), actor: "super-admin" }, ...prev]);
  };

  const totalCustomers = orgs.reduce((s, o) => s + o.customers, 0);
  const totalVolume = orgs.reduce((s, o) => s + o.txVolume, 0);
  const activeOrgs = orgs.filter(o => o.status === "active").length;

  const STAT_CARDS = [
    { icon: Building2, label: "Toplam Organizasyon", value: String(orgs.length), sub: `${activeOrgs} aktif · ${orgs.length - activeOrgs} pasif`, accent: "#22d3ee", delta: 12 },
    { icon: Users, label: "Toplam Aktif Müşteri", value: fmt(totalCustomers), sub: "Tüm tenantlar", accent: "#818cf8", delta: 8 },
    { icon: TrendingUp, label: "Günlük İşlem Hacmi", value: fmtTL(totalVolume), sub: "Bugün · Tüm şubeler", accent: "#34d399", delta: 3 },
    { icon: Server, label: "Sistem Uptime", value: "99.97%", sub: "Son 30 gün · 4 bölge", accent: "#f59e0b" },
  ];

  const HEALTH_BARS = [
    { label: "API Gateway", value: 94, color: "#22d3ee" },
    { label: "Database Cluster", value: 61, color: "#818cf8" },
    { label: "Cache (Redis)", value: 38, color: "#34d399" },
    { label: "Worker Queue", value: 79, color: "#f59e0b" },
  ];

  const INFRA = [
    { icon: Globe, label: "Bölge", value: "4 / 4", color: "#22d3ee" },
    { icon: Database, label: "Replica", value: "3×", color: "#818cf8" },
    { icon: Activity, label: "P99 Latency", value: "42ms", color: "#34d399" },
  ];

  return (
    <div className="min-h-screen w-full" style={{ background: "#020817", color: "#fff", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <AnimatePresence>{showAdd && <AddOrgModal onClose={() => setShowAdd(false)} onAdd={addOrg} />}</AnimatePresence>

      {/* Top Bar */}
      <div className="sticky top-0 z-30 w-full" style={{ background: "rgba(2,8,23,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#0e7490,#22d3ee)", boxShadow: "0 0 16px rgba(34,211,238,0.3)" }}>
              <Layers size={14} className="text-slate-900" />
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-bold text-sm tracking-tight">LoyaltyCore</span>
              <span className="text-slate-600 text-xs ml-2 font-mono">v2.4.1</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div whileHover={{ scale: 1.02 }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <Shield size={11} className="text-emerald-400" />
              <span className="text-emerald-400">Süper Admin Yetkisi Aktif</span>
            </motion.div>
            <div className="relative w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <Bell size={14} className="text-slate-500" />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}>
              <div className="w-5 h-5 rounded-md bg-cyan-500/20 flex items-center justify-center">
                <span className="text-cyan-400 text-xs font-bold">A</span>
              </div>
              <span className="text-slate-300 text-xs hidden sm:block font-mono">superadmin@loyaltycore.io</span>
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-500/10 transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <LogOut size={13} className="text-slate-600 hover:text-rose-400" />
            </button>
          </div>
        </div>
      </div>

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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold self-start sm:self-auto"
            style={{ background: "linear-gradient(135deg,#0e7490,#22d3ee)", color: "#0a0f1e", boxShadow: "0 4px 20px rgba(34,211,238,0.25)" }}>
            <Plus size={15} />Yeni Organizasyon
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(({ icon: Icon, label, value, sub, accent, delta }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-8 translate-x-8"
                style={{ background: `${accent}10` }} />
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
                  <Icon size={16} style={{ color: accent }} />
                </div>
                {delta !== undefined && (
                  <div className="flex items-center gap-1 text-xs font-medium" style={{ color: delta >= 0 ? "#34d399" : "#f87171" }}>
                    {delta >= 0 ? "↑" : "↓"}{Math.abs(delta)}%
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-white mb-1 font-mono tracking-tight">{value}</p>
              <p className="text-slate-400 text-xs font-medium">{label}</p>
              {sub && <p className="text-slate-600 text-xs mt-1">{sub}</p>}
            </motion.div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <OrgTable orgs={orgs} onToggle={toggleOrg} />
          </div>
          <div className="space-y-5">
            {/* System Health */}
            <div className="rounded-2xl p-5" style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-5">
                <Cpu size={13} className="text-cyan-500" />
                <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Sistem Sağlık</span>
              </div>
              <div className="space-y-4">
                {HEALTH_BARS.map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-500 text-xs">{label}</span>
                      <span className="text-xs font-mono font-semibold" style={{ color }}>{value}%</span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
                        className="h-full rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}60` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 grid grid-cols-3 gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {INFRA.map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="text-center p-2.5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <Icon size={13} style={{ color }} className="mx-auto mb-1.5" />
                    <p className="font-mono font-bold text-sm" style={{ color }}>{value}</p>
                    <p className="text-slate-600 text-xs">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <ActivityLog logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
}
