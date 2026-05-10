"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Star, ShoppingBag, MapPin, Bell, TrendingUp,
  Search, AlertCircle, ArrowUpRight, ArrowDownRight, User,
  Edit3, X, Check, CheckCircle, Wifi, WifiOff
} from "lucide-react";

const BLUE = "#2563eb";
const BLUE_LIGHT = "#eff6ff";

interface Transaction {
  id: number;
  customer: string;
  type: "earned" | "spent" | "new";
  pts: number;
  amount: number;
  cashier: string;
  time: string;
}

const BASE_FEED: Transaction[] = [
  { id: 1, customer: "Fatma G.", type: "earned", pts: 240, amount: 480, cashier: "Ayşe K.", time: "14:38" },
  { id: 2, customer: "Mehmet K.", type: "spent", pts: -150, amount: 320, cashier: "Burak Ş.", time: "14:35" },
  { id: 3, customer: "Zeynep A.", type: "earned", pts: 180, amount: 360, cashier: "Ayşe K.", time: "14:31" },
  { id: 4, customer: "Ali Ç.", type: "earned", pts: 90, amount: 180, cashier: "Canan Y.", time: "14:28" },
  { id: 5, customer: "Hülya D.", type: "new", pts: 100, amount: 200, cashier: "Burak Ş.", time: "14:22" },
];

const CASHIERS = [
  { id: 1, name: "Ayşe Korkmaz", avatar: "AK", txCount: 47, newReg: 4, lastSeen: "Az önce", online: true },
  { id: 2, name: "Burak Şahin", avatar: "BŞ", txCount: 38, newReg: 2, lastSeen: "3 dk önce", online: true },
  { id: 3, name: "Canan Yıldız", avatar: "CY", txCount: 31, newReg: 6, lastSeen: "11 dk önce", online: true },
  { id: 4, name: "Doruk Arslan", avatar: "DA", txCount: 22, newReg: 1, lastSeen: "1 saat önce", online: false },
];

const CUSTOMERS_DATA = [
  { id: 1, name: "Fatma Güler", phone: "0532 *** **11", pts: 4820, lastTx: "Bugün 14:38" },
  { id: 2, name: "Mehmet Koç", phone: "0541 *** **72", pts: 2140, lastTx: "Bugün 14:35" },
  { id: 3, name: "Zeynep Aydın", phone: "0555 *** **43", pts: 6310, lastTx: "Bugün 14:31" },
];

const HOURLY = [3, 8, 14, 11, 18, 24, 0, 0, 0];
const HOURS = ["09", "10", "11", "12", "13", "14", "15", "16", "17"];

const TX_TYPE = {
  earned: { label: "Kazandı", color: "#059669", bg: "rgba(5,150,105,0.08)", icon: ArrowUpRight },
  spent: { label: "Harcadı", color: "#d97706", bg: "rgba(217,119,6,0.08)", icon: ArrowDownRight },
  new: { label: "Yeni Üye", color: BLUE, bg: BLUE_LIGHT, icon: User },
};

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

function EditModal({ tx, onClose, onSave }: { tx: Transaction; onClose: () => void; onSave: (t: Transaction) => void }) {
  const [pts, setPts] = useState(String(Math.abs(tx.pts)));
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState(false);
  const valid = pts && Number(pts) > 0 && reason.length >= 3;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}>
      <motion.div initial={{ scale: 0.93, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 16 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="w-full max-w-sm rounded-2xl bg-white p-6" style={{ boxShadow: "0 20px 60px rgba(15,23,42,0.15)" }}>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: BLUE_LIGHT }}>
              <Edit3 size={16} style={{ color: BLUE }} />
            </div>
            <div>
              <p className="text-slate-800 font-semibold text-sm">Puan Düzelt</p>
              <p className="text-slate-400 text-xs">{tx.customer} · {tx.time}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100">
            <X size={14} className="text-slate-400" />
          </button>
        </div>
        <div className="space-y-3 mb-5">
          <div>
            <label className="text-slate-600 text-xs font-medium mb-1.5 block">Yeni Puan Değeri</label>
            <input type="number" value={pts} onChange={e => setPts(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 font-semibold outline-none"
              style={{ background: "#f8fafc", border: `1px solid ${pts && Number(pts) > 0 ? "#bfdbfe" : "#f1f5f9"}` }} />
          </div>
          <div>
            <label className="text-slate-600 text-xs font-medium mb-1.5 block">Düzeltme Sebebi</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Örn: Hatalı tutar girildi..." rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 outline-none resize-none"
              style={{ background: "#f8fafc", border: `1px solid ${reason.length >= 3 ? "#bfdbfe" : "#f1f5f9"}` }} />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 font-medium"
            style={{ border: "1px solid #e2e8f0" }}>İptal</button>
          <button onClick={() => { setSaved(true); setTimeout(() => { onSave({ ...tx, pts: Number(pts) }); onClose(); }, 1000); }}
            disabled={!valid || saved}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: saved ? "#059669" : valid ? BLUE : "#cbd5e1" }}>
            {saved ? <><CheckCircle size={14} />Kaydedildi</> : <><Check size={14} />Onayla</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ManagerDashboardPage() {
  const [feed, setFeed] = useState<Transaction[]>(BASE_FEED);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<typeof CUSTOMERS_DATA>([]);
  const [newTxFlash, setNewTxFlash] = useState(false);
  const [cashierFilter, setCashierFilter] = useState("all");

  useEffect(() => {
    const names = ["Kaan A.", "Seda B.", "Tolga C.", "Mina D."];
    const types = ["earned", "earned", "spent", "new"] as const;
    const cashierNames = ["Ayşe K.", "Burak Ş.", "Canan Y."];
    const interval = setInterval(() => {
      const type = types[Math.floor(Math.random() * types.length)];
      const pts = type === "spent" ? -(Math.floor(Math.random() * 30 + 5) * 10) : Math.floor(Math.random() * 30 + 5) * 10;
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setFeed(prev => [{ id: Date.now(), customer: names[Math.floor(Math.random() * names.length)], type, pts, amount: Math.abs(pts) * 2, cashier: cashierNames[Math.floor(Math.random() * cashierNames.length)], time }, ...prev.slice(0, 9)]);
      setNewTxFlash(true);
      setTimeout(() => setNewTxFlash(false), 1200);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (val.length < 1) return setSearchResults([]);
    setSearchResults(CUSTOMERS_DATA.filter(c => c.name.toLowerCase().includes(val.toLowerCase()) || c.phone.includes(val)));
  };

  const todayPts = feed.filter(t => t.pts > 0).reduce((s, t) => s + t.pts, 0);
  const activeCashiers = CASHIERS.filter(c => c.online).length;
  const filteredFeed = cashierFilter === "all" ? feed : feed.filter(t => t.cashier.startsWith(cashierFilter));
  const maxH = Math.max(...HOURLY, 1);

  return (
    <div className="min-h-screen w-full" style={{ background: "#f8fafc", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <AnimatePresence>{editTx && <EditModal tx={editTx} onClose={() => setEditTx(null)} onSave={updated => setFeed(prev => prev.map(t => t.id === updated.id ? updated : t))} />}</AnimatePresence>

      {/* Top Bar */}
      <div className="bg-white sticky top-0 z-20" style={{ borderBottom: "1px solid #f1f5f9" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: BLUE }}>
              <MapPin size={15} className="text-white" />
            </div>
            <div>
              <p className="text-slate-900 font-bold text-sm leading-tight">İstanbul Cevahir AVM</p>
              <p className="text-slate-400 text-xs">Şube Müdürü · Selin Öztürk</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <motion.div animate={{ scale: newTxFlash ? [1, 1.2, 1] : 1 }}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: BLUE_LIGHT, border: "1px solid #bfdbfe" }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: BLUE }} />
              <span className="text-xs font-semibold" style={{ color: BLUE }}>Canlı</span>
            </motion.div>
            <div className="relative w-8 h-8 flex items-center justify-center rounded-lg" style={{ border: "1px solid #f1f5f9" }}>
              <Bell size={14} className="text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: ShoppingBag, label: "Bugünkü İşlem", value: String(feed.length), color: BLUE },
            { icon: Star, label: "Dağıtılan Puan", value: fmt(todayPts), color: "#7c3aed" },
            { icon: Users, label: "Aktif Kasiyer", value: `${activeCashiers} / ${CASHIERS.length}`, color: "#059669" },
          ].map(({ icon: Icon, label, value, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-5 bg-white" style={{ border: "1px solid #f1f5f9" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}12` }}>
                  <Icon size={17} style={{ color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
              <p className="text-slate-400 text-xs">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Chart + Feed */}
          <div className="lg:col-span-2 space-y-5">
            {/* Hourly Chart */}
            <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #f1f5f9" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-slate-800 font-semibold text-sm">Saatlik Yoğunluk</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Bugün · işlem/saat</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: BLUE }}>
                  <TrendingUp size={13} />En yoğun 14:00
                </div>
              </div>
              <div style={{ height: 100 }}>
                <svg viewBox={`0 0 ${HOURLY.length * 60} 100`} style={{ width: "100%", height: "100%" }}>
                  {HOURLY.map((v, i) => {
                    const barH = (v / maxH) * 70;
                    return (
                      <g key={i}>
                        <rect x={i * 60 + 10} y={80 - barH} width={40} height={barH} rx={4}
                          fill={i === 5 ? BLUE : "#eff6ff"} />
                        <text x={i * 60 + 30} y={98} textAnchor="middle" fontSize={9} fill="#94a3b8">{HOURS[i]}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Live Feed */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #f1f5f9" }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4"
                style={{ borderBottom: "1px solid #f8fafc" }}>
                <div className="flex items-center gap-2">
                  <motion.div animate={{ scale: newTxFlash ? [1, 1.3, 1] : 1 }} className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
                  <h2 className="text-slate-800 font-semibold text-sm">Canlı İşlem Akışı</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#f1f5f9", color: "#64748b" }}>{feed.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">Kasiyer:</span>
                  <select value={cashierFilter} onChange={e => setCashierFilter(e.target.value)}
                    className="text-xs text-slate-600 rounded-lg px-2.5 py-1.5 outline-none"
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <option value="all">Tümü</option>
                    {CASHIERS.map(c => <option key={c.id} value={c.name.split(" ")[0]}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="divide-y" style={{ borderColor: "#f8fafc" }}>
                <AnimatePresence initial={false}>
                  {filteredFeed.slice(0, 10).map(tx => {
                    const t = TX_TYPE[tx.type];
                    const TIcon = t.icon;
                    return (
                      <motion.div key={tx.id} initial={{ opacity: 0, y: -10, background: "#eff6ff" }} animate={{ opacity: 1, y: 0, background: "#ffffff" }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35 }}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 group">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.bg }}>
                          <TIcon size={14} style={{ color: t.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-slate-700 text-xs font-semibold">{tx.customer}</p>
                            <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: t.bg, color: t.color }}>{t.label}</span>
                          </div>
                          <p className="text-slate-400 text-xs">{tx.cashier} · ₺{tx.amount}</p>
                        </div>
                        <div className="text-right flex-shrink-0 mr-2">
                          <p className="text-xs font-bold" style={{ color: t.color }}>{tx.pts > 0 ? "+" : ""}{tx.pts} puan</p>
                          <p className="text-slate-300 text-xs">{tx.time}</p>
                        </div>
                        <button onClick={() => setEditTx(tx)}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: BLUE_LIGHT, color: BLUE, border: "1px solid #bfdbfe" }}>
                          <Edit3 size={11} />Düzelt
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right: Search + Cashiers */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #f1f5f9" }}>
              <h2 className="text-slate-800 font-semibold text-sm mb-3">Müşteri Sorgula</h2>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Ad veya telefon..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-slate-800 outline-none"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }} />
              </div>
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                    {searchResults.map(c => (
                      <div key={c.id} className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: BLUE_LIGHT, color: BLUE }}>
                          {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-700 text-xs font-semibold">{c.name}</p>
                          <p className="text-slate-400 text-xs">{c.phone}</p>
                        </div>
                        <p className="text-xs font-bold" style={{ color: BLUE }}>{fmt(c.pts)}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {search.length >= 1 && searchResults.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#fef9f0", border: "1px solid #fde68a" }}>
                  <AlertCircle size={13} className="text-amber-500" />
                  <p className="text-amber-600 text-xs">Bu şubede eşleşen müşteri yok.</p>
                </div>
              )}
              {!search && (
                <div className="space-y-1.5">
                  {CUSTOMERS_DATA.slice(0, 3).map(c => (
                    <div key={c.id} className="flex items-center gap-2.5 py-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold" style={{ background: BLUE_LIGHT, color: BLUE }}>{c.name[0]}</div>
                      <p className="text-slate-600 text-xs flex-1">{c.name}</p>
                      <span className="text-xs font-semibold" style={{ color: BLUE }}>{fmt(c.pts)} p</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #f1f5f9" }}>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid #f8fafc" }}>
                <h2 className="text-slate-800 font-semibold text-sm">Kasiyer Performansı</h2>
              </div>
              <div className="divide-y" style={{ borderColor: "#f8fafc" }}>
                {[...CASHIERS].sort((a, b) => b.txCount - a.txCount).map((c, i) => (
                  <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 px-5 py-3.5">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
                        style={{ background: c.online ? BLUE_LIGHT : "#f1f5f9", color: c.online ? BLUE : "#94a3b8" }}>{c.avatar}</div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                        style={{ background: c.online ? "#22c55e" : "#94a3b8" }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-700 text-xs font-semibold">{c.name}</p>
                      <p className="text-slate-400 text-xs">{c.lastSeen}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-800 text-xs font-bold">{c.txCount} işlem</p>
                      <p className="text-xs" style={{ color: BLUE }}>{c.newReg} yeni üye</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
