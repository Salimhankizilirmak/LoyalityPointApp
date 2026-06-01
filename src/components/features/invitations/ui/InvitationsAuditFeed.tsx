"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { Mail, Clock, Shield, Building2 } from "lucide-react";

interface InvitationItem {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date | number | null;
  branchName?: string | null;
}

interface InvitationsAuditFeedProps {
  invitations: InvitationItem[];
  isDarkMode?: boolean;
}

export function InvitationsAuditFeed({ invitations, isDarkMode = true }: InvitationsAuditFeedProps) {
  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    switch (s) {
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            Kabul Edildi
          </span>
        );
      case "REVOKED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
            İptal Edildi
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Süresi Doldu
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)] animate-pulse">
            Bekliyor
          </span>
        );
    }
  };

  const getRoleLabel = (role: string) => {
    const r = role.toUpperCase();
    switch (r) {
      case "BOSS":
        return "Patron";
      case "MANAGER":
        return "Yönetici";
      case "CASHIER":
        return "Kasiyer";
      case "CUSTOMER":
        return "Müşteri";
      default:
        return role;
    }
  };

  const formatDate = (dateValue: Date | number | null) => {
    if (!dateValue) return "-";
    const dateObj = typeof dateValue === "number" ? new Date(dateValue * 1000) : new Date(dateValue);

    try {
      return dateObj.toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateObj.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-2 mb-1 pl-1">
        <Clock size={12} className="text-cyan-400" />
        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest font-mono">
          Canlı Davet Takip Paneli
        </span>
      </div>

      <GlassPanel className="p-3 overflow-hidden border border-slate-800/10 dark:border-white/5" elevated={false}>
        {invitations.length === 0 ? (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
            Henüz gönderilmiş personel daveti bulunmamaktadır.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/10 dark:divide-white/5 max-h-[220px] overflow-y-auto pr-1">
            {invitations.map((inv) => (
              <div key={inv.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                    }`}>
                    <Mail size={12} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                      {inv.email}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Shield size={10} className="text-slate-400" />
                        {getRoleLabel(inv.role)}
                      </span>
                      {inv.branchName && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 truncate max-w-[120px]">
                            <Building2 size={10} className="text-slate-400" />
                            {inv.branchName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center sm:text-right gap-3 justify-between sm:justify-end">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatDate(inv.createdAt)}
                  </span>
                  {getStatusBadge(inv.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
