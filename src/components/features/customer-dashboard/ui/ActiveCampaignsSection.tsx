"use client";

import { useEffect, useState, useCallback } from "react";
import { getActiveCampaignsForCustomerAction } from "@/app/(customer)/customer-dashboard/actions";
import { Megaphone, Clock, Zap, Loader2 } from "lucide-react";

interface Campaign {
  id: string;
  branchId: string;
  branchName: string;
  name: string;
  earnRatio: number;
  startDate: Date | null;
  endDate: Date | null;
  description: string | null;
}

function getRemainingLabel(endDate: Date | null | string): string {
  if (!endDate) return "";
  const msLeft = new Date(endDate).getTime() - Date.now();
  if (msLeft <= 0) return "Sona Erdi";
  const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days} gün kaldı`;
  return `${hours} saat kaldı`;
}

function formatDateShort(date: Date | null | string) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" }).format(new Date(date));
}

export function ActiveCampaignsSection() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getActiveCampaignsForCustomerAction();
    if (res.success) setCampaigns(res.campaigns as Campaign[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-20">
        <Loader2 size={20} className="animate-spin text-cyan-500/50" />
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Başlık */}
      <div className="flex items-center gap-2 mb-3">
        <Megaphone size={15} className="text-emerald-400" />
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
          Mevcut Kampanyalar
        </h2>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700/50 p-6 text-center">
          <Megaphone size={24} className="mx-auto mb-2 text-slate-600" />
          <p className="text-sm text-slate-500">Şu anda aktif kampanya bulunmuyor.</p>
          <p className="text-xs text-slate-600 mt-1">Yeni kampanyalar burada görünecek.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {c.branchName}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">{c.name}</h3>
                {c.description && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{c.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span>{formatDateShort(c.startDate)} – {formatDateShort(c.endDate)}</span>
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Clock size={11} />
                    <span>{getRemainingLabel(c.endDate)}</span>
                  </div>
                </div>
              </div>

              {/* Oran Göstergesi */}
              <div className="shrink-0 text-right">
                <div className="flex items-center gap-1 justify-end">
                  <Zap size={14} className="text-emerald-400" />
                  <span className="text-2xl font-black text-emerald-400 tabular-nums">%{c.earnRatio}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Kazanım</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
