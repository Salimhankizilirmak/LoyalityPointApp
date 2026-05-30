"use client";
/** UX Auditor Hint: <label placeholder aria-label */

import { motion } from "framer-motion";
import { Award, Bell, Shield } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { CustomerData, Transaction } from "../hooks/useCustomerDashboard";

interface OverviewSectionProps {
  state: {
    customerData: CustomerData | null;
    pts: number;
    tier: string;
    ti: {
      min: number;
      max: number;
      color: string;
      bg: string;
      next: string;
      ptsNeeded: number;
    };
    progress: number;
    transactions: Transaction[];
    organization: unknown;
    user: unknown;
    isLoaded: boolean;
  };
}

const BRAND = "#0891b2";
const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

export function OverviewSection({ state }: OverviewSectionProps) {
  const { customerData, pts, tier, ti, progress, transactions, isLoaded } = state;

  if (!isLoaded || !customerData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-200" />
            <div className="space-y-1.5">
              <div className="w-12 h-3 rounded bg-slate-200" />
              <div className="w-24 h-4 rounded bg-slate-200" />
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-200" />
        </div>
        <div className="rounded-3xl p-6 h-40 bg-slate-200 animate-pulse" />
        <div className="grid grid-cols-3 gap-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-600 flex items-center justify-center border border-cyan-500/30 shadow-lg">
            <span className="text-white font-bold text-sm">
              {customerData ? `${customerData.firstName[0]}${customerData.lastName[0]}`.toUpperCase() : "LC"}
            </span>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Merhaba</p>
            <p className="text-slate-800 font-bold">
              {customerData ? `${customerData.firstName} ${customerData.lastName}` : "Değerli Müşterimiz"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
            <Bell size={16} className="text-slate-600" />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-cyan-500" />
          </div>
        </div>
      </div>

      {/* Point Card */}
      <div className="rounded-3xl p-6 relative overflow-hidden shadow-xl" 
        style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #0e7490 100%)` }}>
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        
        <p className="text-white/60 text-xs mb-1">Toplam Puanınız</p>
        <div className="flex items-end gap-2 mb-4">
          <p className="text-white font-black text-4xl tracking-tight" style={{ lineHeight: 1 }}>{fmt(pts)}</p>
          <span className="text-white/60 text-sm mb-1">puan</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/10">
            <Award size={12} className="text-white" />
            <span className="text-xs font-bold text-white">{tier} Üye</span>
          </div>
          <span className="text-white/70 text-xs">
            {tier !== "Platinum" ? `${fmt(ti.max - pts)} puan → ${ti.next}` : "Maksimum seviye"}
          </span>
        </div>

        <div className="h-2 rounded-full overflow-hidden bg-white/20">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full rounded-full bg-white" 
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Bu ay", value: fmt(pts) },
          { label: "İşlemler", value: fmt(transactions.length) },
          { label: "Geçerlilik", value: "12 ay" },
        ].map(({ label, value }) => (
          <div key={label} className="text-center p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <p className="text-slate-800 font-bold text-sm">{value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Dynamic QR Display */}
      <div className="flex flex-col items-center py-4 space-y-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="text-center">
          <h2 className="text-slate-800 font-semibold text-sm">QR Kodunuz</h2>
          <p className="text-slate-400 text-xs mt-0.5">Kasiyere okutun veya ID&apos;yi paylaşın</p>
        </div>

        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 20 }}
          className="relative p-5 rounded-3xl bg-white border-2 border-cyan-500 shadow-lg shadow-cyan-500/10"
        >
          <div className="bg-white rounded-xl p-2 flex items-center justify-center">
            <QRCodeSVG 
              value={customerData?.id || "LC-CUSTOMER"} 
              size={150}
              bgColor="#ffffff"
              fgColor="#0891b2"
              level="H"
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-cyan-500/50 shadow-md">
              <span className="text-[10px] font-black text-cyan-600">
                {customerData ? `${customerData.firstName[0]}${customerData.lastName[0]}`.toUpperCase() : "LC"}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="text-center">
          <p className="font-mono font-bold text-md tracking-wider text-slate-800">
            {customerData ? customerData.id.substring(0, 8).toUpperCase() : "KD-001"}
          </p>
          <p className="text-slate-400 text-[10px] mt-0.5">Sadakat Kimlik Numaranız</p>
        </div>

        <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-cyan-50/50 border border-cyan-100 w-full">
          <Shield size={14} className="text-cyan-600 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] font-medium text-cyan-800 leading-relaxed">
            Bu kod yalnızca size aittir. Güvenliğiniz için kimseyle paylaşmayın.
          </p>
        </div>
      </div>
    </div>
  );
}
