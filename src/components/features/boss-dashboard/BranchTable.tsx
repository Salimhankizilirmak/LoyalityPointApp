"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Star, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";

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

interface BranchTableProps {
  branches: Branch[];
}

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

type SortKey = keyof Branch;

export function BranchTable({ branches }: BranchTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; dir: number }>({ key: "transactions", dir: -1 });
  const sorted = [...branches].sort((a, b) => (a[sort.key] > b[sort.key] ? 1 : -1) * sort.dir);

  const toggleSort = (key: SortKey) =>
    setSort(s => s.key === key ? { key, dir: -s.dir } : { key, dir: -1 });

  const COLS: { label: string; key: SortKey }[] = [
    { label: "Şube", key: "name" }, { label: "Şehir", key: "city" },
    { label: "İşlem", key: "transactions" }, { label: "Kazanılan", key: "earnedPts" },
    { label: "Harcanan", key: "spentPts" }, { label: "Durum", key: "status" },
  ];

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs min-w-[560px]">
        <thead>
          <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
            {COLS.map(({ label, key }) => (
              <th key={key} onClick={() => toggleSort(key)}
                className="text-left py-2.5 px-3 text-slate-400 font-semibold uppercase tracking-wider select-none cursor-pointer"
                style={{ fontSize: 10 }}>
                <span className="flex items-center gap-1">
                  {label}
                  {sort.key === key
                    ? (sort.dir === -1 ? <ChevronDown size={11} color="#3b82f6" /> : <ChevronUp size={11} color="#3b82f6" />)
                    : <ChevronDown size={11} color="#cbd5e1" />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((b, i) => (
            <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              className="hover:bg-slate-50 transition-colors" style={{ borderBottom: "1px solid #f8fafc" }}>
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "#eff6ff", color: "#1e40af" }}>{b.name[0]}</div>
                  <span className="text-slate-700 font-medium">{b.name}</span>
                </div>
              </td>
              <td className="py-3 px-3 text-slate-500">{b.city}</td>
              <td className="py-3 px-3 text-slate-700 font-semibold">{fmt(b.transactions)}</td>
              <td className="py-3 px-3 text-emerald-600 font-semibold">+{fmt(b.earnedPts)}</td>
              <td className="py-3 px-3 text-amber-600 font-semibold">-{fmt(b.spentPts)}</td>
              <td className="py-3 px-3">
                <span className="px-2 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: b.status === "active" ? "rgba(16,185,129,0.1)" : "rgba(100,116,139,0.08)",
                    color: b.status === "active" ? "#059669" : "#64748b",
                  }}>
                  {b.status === "active" ? "Aktif" : "Pasif"}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
