"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Trash2, UserCog } from "lucide-react";
import { Branch } from "./types";

interface BranchTableProps {
  branches: Branch[];
  onDelete?: (id: string) => void;
  onChangeManager?: (branch: Branch) => void;
}

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

type SortKey = keyof Branch;

export function BranchTable({ branches, onDelete, onChangeManager }: BranchTableProps) {
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
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs min-w-[700px]">
        <thead>
          <tr className="border-b border-white/10">
            {COLS.map(({ label, key }) => (
              <th key={key} onClick={() => key !== "actions" && toggleSort(key as SortKey)}
                className={`text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-widest select-none ${key !== "actions" ? "cursor-pointer" : ""}`}
                style={{ fontSize: 10 }}>
                <span className="flex items-center gap-1.5">
                  {label}
                  {key !== "actions" && sort.key === key && (
                    sort.dir === -1 ? <ChevronDown size={12} className="text-primary" /> : <ChevronUp size={12} className="text-primary" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {sorted.map((b, i) => (
            <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="transition-colors hover:bg-white/5 group">
              <td className="py-5 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 bg-primary/10 text-primary border border-primary/20">
                    {b.name[0]}
                  </div>
                  <span className="font-bold text-white group-hover:text-primary transition-colors text-sm">{b.name}</span>
                </div>
              </td>
              <td className="py-5 px-4 text-slate-400 font-medium text-sm">{b.city}</td>
              <td className="py-5 px-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-300 text-sm">{b.manager || "Atanmadı"}</span>
                  <button 
                    onClick={() => onChangeManager?.(b)}
                    className="p-2 rounded-lg transition-all hover:bg-primary/10 text-slate-500 hover:text-primary"
                    title="Yöneticiyi Değiştir"
                  >
                    <UserCog size={14} />
                  </button>
                </div>
              </td>
              <td className="py-5 px-4 font-black text-white text-base">{fmt(b.transactions)}</td>
              <td className="py-5 px-4 text-emerald-400 font-black text-base">+{fmt(b.earnedPts)}</td>
              <td className="py-5 px-4 text-amber-400 font-black text-base">-{fmt(b.spentPts)}</td>
              <td className="py-5 px-4">
                <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                  b.status === "active" 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-white/5 text-slate-500 border-white/10"
                }`}>
                  {b.status === "active" ? "Aktif" : "Pasif"}
                </span>
              </td>
              <td className="py-5 px-4 text-right">
                <button 
                  onClick={() => onDelete?.(String(b.id))}
                  className="p-2.5 rounded-xl transition-all hover:bg-rose-500/10 text-slate-600 hover:text-rose-400"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
