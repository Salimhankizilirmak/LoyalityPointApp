"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Trash2, UserCog } from "lucide-react";
import { Branch } from "./types";

interface BranchTableProps {
  branches: Branch[];
  onDelete?: (id: string) => void;
  onChangeManager?: (branch: Branch) => void;
  isDarkMode: boolean;
}

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

type SortKey = keyof Branch;

export function BranchTable({ branches, onDelete, onChangeManager, isDarkMode }: BranchTableProps) {
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

  const COLS: { label: string; key: SortKey }[] = [
    { label: "Şube", key: "name" }, 
    { label: "Şehir", key: "city" },
    { label: "Yönetici", key: "manager" },
    { label: "İşlem", key: "transactions" }, 
    { label: "Kazanılan", key: "earnedPts" },
    { label: "Harcanan", key: "spentPts" }, 
    { label: "Durum", key: "status" },
    { label: "", key: "id" as any },
  ];

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs min-w-[700px]">
        <thead>
          <tr className={`border-b ${isDarkMode ? "border-slate-700" : "border-slate-100"}`}>
            {COLS.map(({ label, key }) => (
              <th key={key} onClick={() => toggleSort(key)}
                className="text-left py-4 px-4 text-slate-400 font-bold uppercase tracking-wider select-none cursor-pointer"
                style={{ fontSize: 10 }}>
                <span className="flex items-center gap-1.5">
                  {label}
                  {sort.key === key && (
                    sort.dir === -1 ? <ChevronDown size={12} className="text-blue-500" /> : <ChevronUp size={12} className="text-blue-500" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`divide-y ${isDarkMode ? "divide-slate-700/50" : "divide-slate-50"}`}>
          {sorted.map((b, i) => (
            <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className={`transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-blue-50/30"}`}>
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                    isDarkMode ? "bg-slate-700 text-blue-400" : "bg-blue-50 text-blue-700"
                  }`}>{b.name[0]}</div>
                  <span className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>{b.name}</span>
                </div>
              </td>
              <td className="py-4 px-4 text-slate-500 font-medium">{b.city}</td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{b.manager || "Atanmadı"}</span>
                  <button 
                    onClick={() => onChangeManager?.(b)}
                    className={`p-1.5 rounded-lg transition-all ${
                      isDarkMode ? "hover:bg-blue-500/10 text-slate-500 hover:text-blue-400" : "hover:bg-blue-50 text-slate-400 hover:text-blue-600"
                    }`}
                    title="Yöneticiyi Değiştir"
                  >
                    <UserCog size={13} />
                  </button>
                </div>
              </td>
              <td className={`py-4 px-4 font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>{fmt(b.transactions)}</td>
              <td className="py-4 px-4 text-emerald-500 font-black">+{fmt(b.earnedPts)}</td>
              <td className="py-4 px-4 text-amber-500 font-black">-{fmt(b.spentPts)}</td>
              <td className="py-4 px-4">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                  b.status === "active" 
                    ? (isDarkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600")
                    : (isDarkMode ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500")
                }`}>
                  {b.status === "active" ? "Aktif" : "Pasif"}
                </span>
              </td>
              <td className="py-4 px-4 text-right">
                <button 
                  onClick={() => onDelete?.(String(b.id))}
                  className={`p-2 rounded-xl transition-all ${
                    isDarkMode ? "hover:bg-rose-500/10 text-slate-500 hover:text-rose-400" : "hover:bg-rose-50 text-slate-300 hover:text-rose-500"
                  }`}
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
