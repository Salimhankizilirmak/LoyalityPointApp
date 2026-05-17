"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronDown, ChevronUp, MoreHorizontal, Eye, ExternalLink, Lock, Check, Loader2
} from "lucide-react";
import { updateBranchLimitAction } from "@/app/admin/actions";

interface Org {
  id: string;
  name: string;
  slug: string;
  email: string;
  branches: number;
  branchLimit?: number;
  created: string;
  status: "active" | "inactive";
  customers: number;
  txVolume: number;
  managerCount?: number;
}

interface QuotaCellProps {
  orgId: string;
  initialLimit: number;
  onLimitUpdated?: () => void;
}

function QuotaCell({ orgId, initialLimit, onLimitUpdated }: QuotaCellProps) {
  const [prevInitialLimit, setPrevInitialLimit] = useState(initialLimit);
  const [limit, setLimit] = useState(initialLimit);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  if (initialLimit !== prevInitialLimit) {
    setPrevInitialLimit(initialLimit);
    setLimit(initialLimit);
  }

  const handleSave = async () => {
    if (limit < 1) return;
    setLoading(true);
    try {
      const res = await updateBranchLimitAction(orgId, limit);
      if ("error" in res) {
        alert(res.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        if (onLimitUpdated) onLimitUpdated();
      }
    } catch (e) {
      console.error(e);
      alert("Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min="1"
        value={limit}
        onChange={(e) => {
          const val = parseInt(e.target.value);
          if (!isNaN(val)) setLimit(val);
        }}
        className="w-12 px-2 py-1 rounded bg-white/5 border border-white/10 text-white font-mono text-center text-xs focus:border-indigo-500/50 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {limit !== initialLimit && (
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-6 h-6 rounded bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          title="Kaydet"
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Check size={12} />
          )}
        </button>
      )}
      {saved && (
        <span className="text-[10px] text-emerald-400 font-bold uppercase animate-pulse">Kaydedildi</span>
      )}
    </div>
  );
}

interface OrgTableProps {
  orgs: Org[];
  onToggle: (id: string, currentStatus: boolean) => void;
  onLimitUpdated?: () => void;
}

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

export function OrgTable({ orgs, onToggle, onLimitUpdated }: OrgTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof Org>("customers");
  const [sortDir, setSortDir] = useState(-1);
  const [menuId, setMenuId] = useState<string | null>(null);

  const sorted = orgs
    .filter(o => o.name.toLowerCase().includes(search.toLowerCase()) || o.slug.includes(search.toLowerCase()))
    .sort((a, b) => {
      const valA = a[sortKey] ?? "";
      const valB = b[sortKey] ?? "";
      return (valA > valB ? 1 : -1) * sortDir;
    });

  const toggleSort = (key: keyof Org) => {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(-1); }
  };

  const SortIcon = ({ k }: { k: keyof Org }) =>
    sortKey === k
      ? (sortDir === -1 ? <ChevronDown size={11} className="text-indigo-400" /> : <ChevronUp size={11} className="text-indigo-400" />)
      : <ChevronDown size={11} className="text-slate-700" />;

  const COLS = [
    { label: "Organizasyon", key: "name" as keyof Org },
    { label: "Oluşturulma", key: "created" as keyof Org },
    { label: "Şube", key: "branches" as keyof Org },
    { label: "Kota Sınırı", key: "branchLimit" as keyof Org },
    { label: "Müşteri", key: "customers" as keyof Org },
    { label: "Patron", key: "email" as keyof Org },
    { label: "Durum", key: "status" as keyof Org },
    { label: "", key: null as unknown as keyof Org },
  ];

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-[#13131a] backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-b border-white/5">
        <div>
          <h2 className="text-sm font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">Organizasyon Yönetimi</h2>
          <p className="text-slate-500 text-xs mt-0.5">{orgs.length} tenant kayıtlı</p>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Organizasyon ara..."
            className="pl-9 pr-4 py-2.5 rounded-xl text-xs text-white outline-none w-full sm:w-64 bg-white/5 border border-white/10 focus:border-indigo-500/50 transition-all"
            style={{ caretColor: "#6366f1" }} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {COLS.map(({ label, key }) => (
                <th key={label} onClick={() => key && toggleSort(key)}
                  className="text-left px-4 py-3 font-semibold uppercase tracking-widest select-none"
                  style={{ color: "#334155", cursor: key ? "pointer" : "default", whiteSpace: "nowrap" }}>
                  <span className="flex items-center gap-1">{label} {key && <SortIcon k={key} />}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((org, i) => (
              <motion.tr key={org.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="group" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: "rgba(34,211,238,0.1)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.15)" }}>
                      {org.name[0]}
                    </div>
                    <div>
                      <p className="text-white font-medium">{org.name}</p>
                      <p className="text-slate-600 font-mono text-xs">{org.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-slate-500 font-mono whitespace-nowrap">{org.created}</td>
                <td className="px-4 py-3.5"><span className="text-slate-300 font-semibold">{fmt(org.branches)}</span></td>
                <td className="px-4 py-3.5">
                  <QuotaCell orgId={org.id} initialLimit={org.branchLimit ?? 2} onLimitUpdated={onLimitUpdated} />
                </td>
                <td className="px-4 py-3.5"><span className="text-slate-300 font-semibold">{fmt(org.customers)}</span></td>
                <td className="px-4 py-3.5"><span className="text-slate-400 font-mono">{org.email}</span></td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => onToggle(org.id, org.status === "active")}
                      className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
                        org.status === "active" ? "bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)]" : "bg-slate-700"
                      }`}
                    >
                      <motion.div 
                        animate={{ x: org.status === "active" ? 22 : 2 }}
                        className="absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm"
                      />
                    </button>
                    <span className={`text-[10px] font-bold uppercase tracking-tight ${org.status === "active" ? "text-indigo-400" : "text-slate-500"}`}>
                      {org.status === "active" ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="relative">
                    <button onClick={() => setMenuId(menuId === org.id ? null : org.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/5 transition-all">
                      <MoreHorizontal size={14} className="text-slate-500" />
                    </button>
                    <AnimatePresence>
                      {menuId === org.id && (
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -5 }}
                          className="absolute right-0 top-8 z-20 rounded-xl overflow-hidden w-40"
                          style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}
                          onMouseLeave={() => setMenuId(null)}>
                          {[{ icon: Eye, label: "Detay Görüntüle" }, { icon: ExternalLink, label: "Panele Git" }, { icon: Lock, label: "Erişimi Kilitle" }]
                            .map(({ icon: Icon, label }) => (
                              <button key={label} onClick={() => setMenuId(null)}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                                <Icon size={12} />{label}
                              </button>
                            ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
