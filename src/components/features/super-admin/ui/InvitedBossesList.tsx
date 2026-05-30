"use client";
 
import { motion } from "framer-motion";
import { Mail, Clock, CheckCircle2, UserCheck, Timer, XCircle, AlertCircle } from "lucide-react";
import { InvitedBoss } from "../types";
 
interface InvitedBossesListProps {
  bosses: InvitedBoss[];
  isDarkMode: boolean;
  onRevoke?: (id: string, organizationId?: string) => Promise<void>;
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

  const getStatusBadge = (status: InvitedBoss["status"]) => {
    switch (status) {
      case "accepted":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.2)]",
          icon: <CheckCircle2 size={10} className="text-emerald-400 animate-pulse" />,
          text: "AKTİF",
        };
      case "revoked":
        return {
          bg: "bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]",
          icon: <XCircle size={10} className="text-rose-400" />,
          text: "İPTAL EDİLDİ",
        };
      case "expired":
        return {
          bg: "bg-slate-500/10 text-slate-400 border border-slate-500/30 shadow-[0_0_12px_rgba(148,163,184,0.2)]",
          icon: <AlertCircle size={10} className="text-slate-400" />,
          text: "SÜRESİ DOLDU",
        };
      case "pending":
      default:
        return {
          bg: "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
          icon: <Clock size={10} className="text-amber-400 animate-pulse" />,
          text: "DAVET EDİLDİ / ONAY BEKLİYOR",
        };
    }
  };

  const getStatusIcon = (status: InvitedBoss["status"]) => {
    switch (status) {
      case "accepted":
        return {
          class: "bg-emerald-500/10 text-emerald-500",
          element: <UserCheck size={18} />,
        };
      case "revoked":
        return {
          class: "bg-rose-500/10 text-rose-500",
          element: <XCircle size={18} />,
        };
      case "expired":
        return {
          class: "bg-slate-500/10 text-slate-500",
          element: <AlertCircle size={18} />,
        };
      case "pending":
      default:
        return {
          class: "bg-amber-500/10 text-amber-500",
          element: <Timer size={18} />,
        };
    }
  };
 
  return (
    <div className={`rounded-4xl p-4 border transition-all ${isDarkMode ? "bg-[#09090b] border-white/5 shadow-2xl" : "bg-white border-slate-200 shadow-sm"
      }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Mail size={18} className="text-indigo-400" />
          <h2 className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-800"}`}>Davet Edilen Patronlar</h2>
        </div>
      </div>
 
      <div className="space-y-3">
        {bosses.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-slate-500 text-xs">Henüz davet edilen patron bulunmuyor.</p>
          </div>
        ) : (
          bosses.map((boss, i) => {
            const badge = getStatusBadge(boss.status);
            const iconInfo = getStatusIcon(boss.status);
            return (
              <motion.div
                key={boss.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isDarkMode ? "bg-[#13131a] border-white/5 hover:border-indigo-500/30 group" : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconInfo.class}`}>
                    {iconInfo.element}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{boss.email}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {formatDate(boss.createdAt)} davet edildi
                    </p>
                  </div>
                </div>
 
                <div className="flex flex-col items-end gap-1.5">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${badge.bg}`}>
                    {badge.icon} {badge.text}
                  </div>
                  {boss.status === "pending" && onRevoke && (
                    <button
                      onClick={() => onRevoke(boss.id, boss.organizationId)}
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
            );
          })
        )}
      </div>
    </div>
  );
}
