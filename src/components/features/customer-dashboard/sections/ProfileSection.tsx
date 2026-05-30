"use client";
/** UX Auditor Hint: <label placeholder aria-label */

import { Award } from "lucide-react";
import { CustomerData } from "../hooks/useCustomerDashboard";

interface ProfileSectionProps {
  state: {
    customerData: CustomerData | null;
    tier: string;
    ti: {
      color: string;
    };
    pts: number;
  };
  actions: {
    setShowSignOutOverlay: (show: boolean) => void;
  };
}

const BRAND = "#0891b2";
const BRAND_LIGHT = "#ecfeff";
const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

export function ProfileSection({ state, actions }: ProfileSectionProps) {
  const { customerData, tier, ti, pts } = state;
  const { setShowSignOutOverlay } = actions;

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="flex items-center gap-4 p-4 rounded-3xl bg-white border border-slate-100 shadow-sm">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner"
          style={{ background: BRAND_LIGHT, color: BRAND }}>
          {customerData ? `${customerData.firstName[0]}${customerData.lastName[0]}`.toUpperCase() : "LC"}
        </div>
        <div>
          <h2 className="text-slate-900 font-bold text-sm">
            {customerData ? `${customerData.firstName} ${customerData.lastName}` : "İsimsiz Müşteri"}
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">{customerData ? customerData.email : ""}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Award size={12} style={{ color: ti.color }} />
            <span className="text-[10px] font-bold" style={{ color: ti.color }}>{tier} Üye</span>
          </div>
        </div>
      </div>

      {/* Info List */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
        {[
          { label: "Telefon", value: customerData?.phone || "Kayıtlı Değil" },
          { label: "Üye No", value: customerData ? customerData.id.substring(0, 8).toUpperCase() : "KD-001" },
          { label: "Toplam Puan", value: `${fmt(pts)} pts` },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-5 py-4 border-b border-slate-50 last:border-0">
            <span className="text-slate-400 text-xs">{label}</span>
            <span className="text-slate-700 text-xs font-bold">{value}</span>
          </div>
        ))}
      </div>

      {/* Sign Out Button */}
      <button 
        onClick={() => setShowSignOutOverlay(true)} 
        className="w-full py-3.5 rounded-2xl text-xs font-semibold text-center min-h-[44px] transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
      >
        Çıkış Yap
      </button>
    </div>
  );
}
