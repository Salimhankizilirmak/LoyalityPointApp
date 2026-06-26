"use client";

import { Wallet } from "lucide-react";

interface DigitalWalletCardProps {
  pts: number;
}

export function DigitalWalletCard({ pts }: DigitalWalletCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-cyan-500/35 bg-[#0b0f1d]/90 p-7 shadow-[0_0_35px_rgba(6,182,212,0.15)] flex flex-col justify-between min-h-[220px] group transition-all duration-500 hover:border-cyan-400/50">
      {/* Kart Neon Süslemeleri */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      
      {/* Kart Üst Kılavuz */}
      <div className="flex justify-between items-start w-full relative z-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase font-mono">
            Okut Kazan Kartı
          </span>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
            Sadakat Programı
          </span>
        </div>
        <Wallet className="text-cyan-400 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" size={22} />
      </div>

      {/* Parlayan Puan Göstergesi */}
      <div className="my-6 relative z-10 flex flex-col items-center justify-center text-center">
        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Mevcut Bakiye</span>
        <span className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-emerald-300 to-indigo-400 filter drop-shadow-[0_0_20px_rgba(34,211,238,0.3)] mt-1.5 font-mono">
          ₺{pts.toFixed(2)} Puan
        </span>
      </div>

      {/* Kart Alt Bilgi */}
      <div className="flex justify-between items-center w-full relative z-10 pt-4 border-t border-white/5 text-[9px] font-mono text-slate-500">
        <span className="uppercase font-bold tracking-wider">GÜNCEL DURUM</span>
        <span className="text-cyan-400/90 font-black tracking-widest uppercase">AKTİF HESAP</span>
      </div>
    </div>
  );
}
export default DigitalWalletCard;
