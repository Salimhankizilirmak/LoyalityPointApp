"use client";

import { motion } from "framer-motion";
import { BossInfo } from "../types";

interface QuotaProgressBarProps {
  bossInfo: BossInfo | null;
  realBranchesCount: number;
}

export function QuotaProgressBar({ bossInfo, realBranchesCount }: QuotaProgressBarProps) {
  if (!bossInfo) return null;
  return (
    <div className="glass-panel-elevated rounded-3xl p-6 transition-all border border-white/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Şube Kotası Durumu</h3>
          <p className="text-xs text-slate-400">Toplam lisanslı şube sınırınız</p>
        </div>
        <div className="text-right">
          <span className="text-sm font-mono font-bold text-indigo-400">{realBranchesCount}</span>
          <span className="text-xs text-slate-500 font-mono"> / {bossInfo.branchLimit || 2} Şube</span>
        </div>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (realBranchesCount / (bossInfo.branchLimit || 2)) * 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${realBranchesCount >= (bossInfo.branchLimit || 2)
            ? "bg-gradient-to-r from-rose-500 to-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
            : "bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
            }`}
        />
      </div>
      {realBranchesCount >= (bossInfo.branchLimit || 2) && (
        <p className="text-[11px] text-rose-400 font-medium mt-2.5 flex items-center gap-1.5 animate-pulse">
          ⚠️ Şube kotanız dolmuştur. Yeni şube eklemek için lütfen sistem yöneticinizle iletişime geçin.
        </p>
      )}
    </div>
  );
}
