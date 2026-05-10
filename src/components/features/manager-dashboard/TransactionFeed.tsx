"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, User, Edit3 } from "lucide-react";
import { Transaction } from "./types";

interface TransactionFeedProps {
  transactions: Transaction[];
  isDarkMode: boolean;
  onEdit: (tx: Transaction) => void;
  flash: boolean;
}

const TX_TYPE = {
  earned: { label: "Kazandı", color: "#059669", bg: "rgba(5,150,105,0.08)", icon: ArrowUpRight },
  spent: { label: "Harcadı", color: "#d97706", bg: "rgba(217,119,6,0.08)", icon: ArrowDownRight },
  new: { label: "Yeni Üye", color: "#2563eb", bg: "rgba(37,99,235,0.08)", icon: User },
};

export function TransactionFeed({
  transactions,
  isDarkMode,
  onEdit,
  flash
}: TransactionFeedProps) {
  return (
    <div className={`rounded-2xl overflow-hidden border transition-all ${
      isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100 shadow-sm"
    }`}>
      <div className={`flex items-center justify-between px-5 py-4 border-b ${
        isDarkMode ? "border-slate-700" : "border-slate-50"
      }`}>
        <div className="flex items-center gap-2">
          <motion.div 
            animate={{ scale: flash ? [1, 1.4, 1] : 1 }} 
            className="w-2 h-2 rounded-full" 
            style={{ background: "#22c55e", boxShadow: flash ? "0 0 8px #22c55e" : "none" }} 
          />
          <h2 className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-800"}`}>Canlı İşlem Akışı</h2>
        </div>
      </div>

      <div className={`divide-y ${isDarkMode ? "divide-slate-700" : "divide-slate-50"}`}>
        {transactions.length > 0 ? (
          transactions.map((tx, i) => {
            const t = TX_TYPE[tx.type] || TX_TYPE.earned;
            const TIcon = t.icon;
            return (
              <motion.div 
                key={tx.id} 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-4 px-5 py-3.5 group hover:bg-blue-500/5 transition-colors`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`} 
                  style={{ background: t.bg }}>
                  <TIcon size={16} style={{ color: t.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${isDarkMode ? "text-white" : "text-slate-700"}`}>{tx.customer}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">{tx.cashier} · ₺{tx.amount}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-black tracking-tight" style={{ color: t.color }}>
                    {tx.pts > 0 ? "+" : ""}{tx.pts} puan
                  </p>
                  <p className="text-slate-400 text-[10px] font-medium mt-0.5">{tx.time}</p>
                </div>
                <button 
                  onClick={() => onEdit(tx)}
                  className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all ${
                    isDarkMode ? "hover:bg-slate-700 text-slate-500" : "hover:bg-slate-100 text-slate-400"
                  }`}
                >
                  <Edit3 size={14} />
                </button>
              </motion.div>
            );
          })
        ) : (
          <div className="py-10 text-center">
            <p className="text-slate-500 text-xs">Henüz işlem bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
}
