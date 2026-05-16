"use client";

import { motion } from "framer-motion";
import { Mail, Clock, CheckCircle2, UserCheck, Timer } from "lucide-react";
import { InvitedBoss } from "./types";

interface InvitedBossesListProps {
  bosses: InvitedBoss[];
  isDarkMode: boolean;
  onRevoke?: (id: string) => Promise<void>;
}

export function InvitedBossesList({ bosses, isDarkMode, onRevoke }: InvitedBossesListProps) {
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`rounded-3xl p-6 border transition-all ${
      isDarkMode ? "bg-[#0a0a0f] border-white/5 shadow-2xl" : "bg-white border-slate-200 shadow-sm"
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Mail size={18} className="text-indigo-400" />
          <h2 className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-800"}`}>Davet Edilen Patronlar</h2>
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-500/10 px-2 py-1 rounded-lg">
          Clerk Live
        </span>
      </div>

      <div className="space-y-3">
        {bosses.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-slate-500 text-xs">Henüz davet edilen patron bulunmuyor.</p>
          </div>
        ) : (
          bosses.map((boss, i) => (
            <motion.div
              key={boss.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                isDarkMode ? "bg-[#13131a] border-white/5 hover:border-indigo-500/30 group" : "bg-slate-50 border-slate-100 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  boss.status === "accepted" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                }`}>
                  {boss.status === "accepted" ? <UserCheck size={18} /> : <Timer size={18} />}
                </div>
                <div>
                  <p className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{boss.email}</p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock size={10} /> {formatDate(boss.createdAt)} davet edildi
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                  boss.status === "accepted" 
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                }`}>
                  {boss.status === "accepted" ? (
                    <>
                      <CheckCircle2 size={10} /> Kabul Edildi
                    </>
                  ) : (
                    <>
                      <Clock size={10} /> Bekliyor
                    </>
                  )}
                </div>
                {boss.status === "pending" && onRevoke && (
                  <button 
                    onClick={() => onRevoke(boss.id)}
                    className="text-[10px] font-bold text-rose-500 hover:text-white hover:bg-rose-500 px-2 py-1 rounded transition-colors"
                  >
                    İptal Et
                  </button>
                )}
                {boss.lastSignIn && (
                  <p className="text-[9px] text-slate-500 font-medium">
                    Son giriş: {formatDate(boss.lastSignIn)}
                  </p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
