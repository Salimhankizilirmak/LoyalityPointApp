"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Trash2, UserCog, Power } from "lucide-react";
import { Branch } from "./types";

interface BranchTableProps {
  branches: Branch[];
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onChangeManager?: (branch: Branch) => void;
}

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

type SortKey = keyof Branch;

export function BranchTable({ branches, onDelete, onToggleStatus, onChangeManager }: BranchTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; dir: number }>({ key: "transactions", dir: -1 });
  const sorted = [...branches].sort((a, b) => {
    const valA = a[sort.key];
    const valB = b[sort.key];
    if (typeof valA === "string" && typeof valB === "string") {
      return valA.localeCompare(valB) * sort.dir;
    }
    return ((valA as number) > (valB as number) ? 1 : -1) * sort.dir;
  });

  const toggleSort = (key: SortKey) =>
    setSort(s => s.key === key ? { key, dir: -s.dir } : { key, dir: -1 });

  const COLS: { label: string; key: SortKey | "actions" }[] = [
    { label: "Şube", key: "name" }, 
    { label: "Şehir", key: "city" },
    { label: "Yönetici", key: "manager" },
    { label: "İşlem", key: "transactions" }, 
    { label: "Kazanılan", key: "earnedPts" },
    { label: "Harcanan", key: "spentPts" }, 
    { label: "Durum", key: "status" },
    { label: "", key: "actions" },
  ];

  return (
    <div className="overflow-x-auto -mx-1 custom-scrollbar">
      <table className="w-full min-w-[1000px] border-separate border-spacing-0">
        <thead>
          <tr>
            {COLS.map(({ label, key }) => (
              <th 
                key={key} 
                onClick={() => key !== "actions" && toggleSort(key as SortKey)}
                className={`text-left py-5 px-4 text-slate-400 font-bold uppercase tracking-[0.15em] select-none border-b border-white/5 ${key !== "actions" ? "cursor-pointer hover:text-white transition-colors" : ""}`}
                style={{ fontSize: 10 }}
              >
                <div className="flex items-center gap-2">
                  {label}
                  {key !== "actions" && sort.key === key && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      {sort.dir === -1 ? <ChevronDown size={14} className="text-indigo-400" /> : <ChevronUp size={14} className="text-indigo-400" />}
                    </motion.span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {sorted.map((b, i) => (
            <motion.tr 
              key={b.id} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.04 }}
              className="transition-all duration-300 hover:bg-white/[0.02] group"
            >
              <td className="py-6 px-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5 group-hover:scale-110 transition-transform duration-300">
                    {b.name[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-white group-hover:text-indigo-400 transition-colors text-sm tracking-tight">{b.name}</span>
                  </div>
                </div>
              </td>
              <td className="py-6 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-indigo-500 transition-colors" />
                  <span className="text-slate-300 font-medium text-[13px]">{b.city}</span>
                </div>
              </td>
              <td className="py-6 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                    {b.manager ? b.manager[0] : "?"}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`font-semibold text-[13px] ${b.manager ? "text-slate-200" : "text-slate-500 italic"}`}>
                      {b.manager || "Atanmadı"}
                    </span>
                    <button 
                      onClick={() => onChangeManager?.(b)}
                      className="p-1.5 rounded-lg transition-all hover:bg-indigo-500/20 text-slate-500 hover:text-indigo-400 opacity-0 group-hover:opacity-100"
                      title="Yöneticiyi Değiştir"
                    >
                      <UserCog size={14} />
                    </button>
                  </div>
                </div>
              </td>
              <td className="py-6 px-4">
                <span className="font-bold text-white text-base font-mono">{fmt(b.transactions)}</span>
              </td>
              <td className="py-6 px-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-400 font-black text-sm">+{fmt(b.earnedPts)}</span>
                </div>
              </td>
              <td className="py-6 px-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-amber-400 font-black text-sm">-{fmt(b.spentPts)}</span>
                </div>
              </td>
              <td className="py-6 px-4">
                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                  b.status === "active" 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/20"
                    : "bg-white/5 text-slate-500 border-white/10"
                }`}>
                  {b.status === "active" ? "Aktif" : "Pasif"}
                </span>
              </td>
              <td className="py-6 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => onToggleStatus?.(String(b.id))}
                    className={`p-3 rounded-2xl transition-all active:scale-90 ${
                      b.status === "active" 
                        ? "hover:bg-amber-500/10 text-slate-600 hover:text-amber-400" 
                        : "hover:bg-emerald-500/10 text-slate-600 hover:text-emerald-400"
                    }`}
                    title={b.status === "active" ? "Pasif Yap" : "Aktif Yap"}
                  >
                    {b.status === "active" ? <Power size={18} /> : <Power size={18} className="rotate-180" />}
                  </button>
                  <button 
                    onClick={() => onDelete?.(String(b.id))}
                    className="p-3 rounded-2xl transition-all hover:bg-rose-500/10 text-slate-600 hover:text-rose-400 active:scale-90"
                    title="Şubeyi Sil"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
