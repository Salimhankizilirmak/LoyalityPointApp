"use client";

import { motion } from "framer-motion";
import { Star, Gift } from "lucide-react";
import { TxType } from "../hooks/useCashierDashboard";

interface ActionButtonsProps {
  customer: { id: string } | null;
  txType: TxType;
  setTxType: (type: TxType) => void;
  isDarkMode: boolean;
}

export function ActionButtons({
  customer,
  txType,
  setTxType,
  isDarkMode,
}: ActionButtonsProps) {
  const disabled = !customer;

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Puan Yükle (Earn) */}
      <motion.button
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.97 } : {}}
        onClick={() => !disabled && setTxType("EARN")}
        disabled={disabled}
        className={`flex flex-col items-start justify-center gap-3 px-5 rounded-2xl text-left border transition-all duration-300 relative overflow-hidden group min-h-[80px] ${
          disabled
            ? "opacity-30 cursor-not-allowed border-white/5 bg-slate-900/10"
            : txType === "EARN"
            ? "bg-emerald-500/5 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)] cursor-pointer"
            : isDarkMode
            ? "bg-white/[0.01] border-white/[0.05] hover:border-emerald-500/40 hover:bg-emerald-500/5 cursor-pointer"
            : "bg-slate-50/50 border-slate-200 hover:border-emerald-500/40 hover:bg-emerald-500/5 cursor-pointer"
        }`}
      >
        <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-emerald-500/5 blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
        <Star
          size={20}
          className={
            disabled
              ? "text-slate-600"
              : txType === "EARN"
              ? "text-emerald-400"
              : "text-slate-500 group-hover:text-emerald-400 transition-colors"
          }
        />
        <div>
          <p
            className={`text-xs font-black uppercase tracking-wider ${
              disabled
                ? "text-slate-600"
                : txType === "EARN"
                ? "text-emerald-400"
                : isDarkMode
                ? "text-slate-400"
                : "text-slate-600"
            }`}
          >
            Puan Yükle
          </p>
          <p className="text-[9px] text-slate-500">Alışveriş Üzerinden Earn</p>
        </div>
      </motion.button>

      {/* Puan Harca (Redeem) */}
      <motion.button
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.97 } : {}}
        onClick={() => !disabled && setTxType("BURN")}
        disabled={disabled}
        className={`flex flex-col items-start justify-center gap-3 px-5 rounded-2xl text-left border transition-all duration-300 relative overflow-hidden group min-h-[80px] ${
          disabled
            ? "opacity-30 cursor-not-allowed border-white/5 bg-slate-900/10"
            : txType === "BURN"
            ? "bg-rose-500/5 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)] cursor-pointer"
            : isDarkMode
            ? "bg-white/[0.01] border-white/[0.05] hover:border-rose-500/40 hover:bg-rose-500/5 cursor-pointer"
            : "bg-slate-50/50 border-slate-200 hover:border-rose-500/40 hover:bg-rose-500/5 cursor-pointer"
        }`}
      >
        <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-rose-500/5 blur-xl pointer-events-none group-hover:bg-rose-500/10 transition-all" />
        <Gift
          size={20}
          className={
            disabled
              ? "text-slate-600"
              : txType === "BURN"
              ? "text-rose-400"
              : "text-slate-500 group-hover:text-rose-400 transition-colors"
          }
        />
        <div>
          <p
            className={`text-xs font-black uppercase tracking-wider ${
              disabled
                ? "text-slate-600"
                : txType === "BURN"
                ? "text-rose-400"
                : isDarkMode
                ? "text-slate-400"
                : "text-slate-600"
            }`}
          >
            Puan Harca
          </p>
          <p className="text-[9px] text-slate-500">Bakiyeden Redeem</p>
        </div>
      </motion.button>
    </div>
  );
}
