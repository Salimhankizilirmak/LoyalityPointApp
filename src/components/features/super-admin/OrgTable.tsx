"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronDown, ChevronUp, MoreHorizontal, Eye, ExternalLink, Lock
} from "lucide-react";

interface Org {
  id: string;
  name: string;
  slug: string;
  email: string;
  branches: number;
  created: string;
  status: "active" | "inactive";
  customers: number;
  txVolume: number;
}

interface OrgTableProps {
  orgs: Org[];
  onToggle: (id: string, currentStatus: boolean) => void;
}

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

export function OrgTable({ orgs, onToggle }: OrgTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof Org>("customers");
  const [sortDir, setSortDir] = useState(-1);
  const [menuId, setMenuId] = useState<string | null>(null);

  const sorted = orgs
    .filter(o => o.name.toLowerCase().includes(search.toLowerCase()) || o.slug.includes(search.toLowerCase()))
    .sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1) * sortDir);

  const toggleSort = (key: keyof Org) => {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(-1); }
  };

  const SortIcon = ({ k }: { k: keyof Org }) =>
    sortKey === k
      ? (sortDir === -1 ? <ChevronDown size={11} className="text-cyan-400" /> : <ChevronUp size={11} className="text-cyan-400" />)
      : <ChevronDown size={11} className="text-slate-700" />;

  const COLS = [
    { label: "Organizasyon", key: "name" as keyof Org },
    { label: "Oluşturulma", key: "created" as keyof Org },
    { label: "Şube", key: "branches" as keyof Org },
    { label: "Müşteri", key: "customers" as keyof Org },
    { label: "Patron", key: "email" as keyof Org },
    { label: "Durum", key: "status" as keyof Org },
    { label: "", key: null as unknown as keyof Org },
  ];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div>
          <h2 className="text-white font-semibold text-sm">Organizasyon Yönetimi</h2>
          <p className="text-slate-500 text-xs mt-0.5">{orgs.length} tenant kayıtlı</p>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Organizasyon ara..."
            className="pl-8 pr-4 py-2 rounded-lg text-xs text-white outline-none w-full sm:w-52"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", caretColor: "#22d3ee" }} />
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
                <td className="px-4 py-3.5"><span className="text-slate-300 font-semibold">{fmt(org.customers)}</span></td>
                <td className="px-4 py-3.5"><span className="text-slate-400 font-mono">{org.email}</span></td>
                <td className="px-4 py-3.5">
                  <button onClick={() => onToggle(org.id, org.status === "active")}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: org.status === "active" ? "rgba(34,197,94,0.1)" : "rgba(100,116,139,0.1)",
                      color: org.status === "active" ? "#4ade80" : "#64748b",
                      border: `1px solid ${org.status === "active" ? "rgba(74,222,128,0.25)" : "rgba(100,116,139,0.2)"}`,
                    }}>
                    <div className="w-1.5 h-1.5 rounded-full"
                      style={{ background: org.status === "active" ? "#4ade80" : "#64748b" }} />
                    {org.status === "active" ? "Aktif" : "Pasif"}
                  </button>
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
