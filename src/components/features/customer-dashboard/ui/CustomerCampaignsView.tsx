"use client";
import React, { useEffect, useState } from "react";
import { getAllCampaignsForCustomerAction } from "@/app/(customer)/customer-dashboard/actions";
import { Megaphone, Calendar, MapPin, Loader2 } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";

type CampaignStatus = "ACTIVE" | "INACTIVE" | "UPCOMING" | "ENDED";

interface CampaignData {
  id: string;
  title: string;
  description: string;
  status: CampaignStatus;
  startDate: string | null;
  endDate: string | null;
  branchName: string;
  createdAt: string;
}

export function CustomerCampaignsView() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      const res = await getAllCampaignsForCustomerAction();
      if (res.success && res.campaigns) {
        setCampaigns(res.campaigns as CampaignData[]);
      }
      setLoading(false);
    }
    fetchCampaigns();
  }, []);

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case "ACTIVE":
        return <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">Aktif</span>;
      case "UPCOMING":
        return <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full border border-amber-500/30">Yakında</span>;
      case "ENDED":
        return <span className="px-2 py-1 bg-slate-500/20 text-slate-400 text-xs font-bold rounded-full border border-slate-500/30">Süresi Bitti</span>;
      case "INACTIVE":
      default:
        return <span className="px-2 py-1 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-full border border-rose-500/30">Pasif</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-cyan-400" />
        <p>Kampanyalar yükleniyor...</p>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-400 text-center px-4">
        <Megaphone className="w-16 h-16 mb-4 text-slate-600/50" />
        <h3 className="text-xl font-bold text-slate-200 mb-2">Henüz Kampanya Yok</h3>
        <p>Kayıtlı olduğunuz şubelerde şu an için yayınlanmış bir kampanya bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8 text-center md:text-left">
        <h2 className="text-2xl md:text-3xl font-black text-white flex items-center justify-center md:justify-start gap-3">
          <Megaphone className="w-7 h-7 text-cyan-400" />
          Size Özel Kampanyalar
        </h2>
        <p className="text-slate-400 mt-2">Kayıtlı olduğunuz şubelerdeki fırsatları buradan takip edebilirsiniz.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((camp) => (
          <GlassPanel key={camp.id} className="p-6 relative flex flex-col group hover:border-cyan-500/50 transition-colors duration-300">
            <div className="absolute top-4 right-4">
              {getStatusBadge(camp.status)}
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2 pr-16 leading-tight">{camp.title}</h3>
            
            <p className="text-slate-300 text-sm mb-6 flex-1 leading-relaxed">
              {camp.description || "Detay belirtilmemiş."}
            </p>
            
            <div className="flex flex-col gap-2.5 mt-auto pt-4 border-t border-white/5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium text-slate-300">{camp.branchName}</span>
              </div>
              {(camp.startDate || camp.endDate) && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {camp.startDate ? new Date(camp.startDate).toLocaleDateString("tr-TR") : "Belirsiz"} 
                    {" - "} 
                    {camp.endDate ? new Date(camp.endDate).toLocaleDateString("tr-TR") : "Süresiz"}
                  </span>
                </div>
              )}
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}
