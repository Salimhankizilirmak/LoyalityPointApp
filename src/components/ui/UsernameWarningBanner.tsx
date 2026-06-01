"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface UsernameWarningBannerProps {
  username?: string | null;
  settingsUrl?: string;
  onActionClick?: () => void;
}

export default function UsernameWarningBanner({
  username,
  settingsUrl,
  onActionClick,
}: UsernameWarningBannerProps) {
  // Eğer kullanıcı adı tanımlıysa hiçbir şey render etme
  if (username && username.trim() !== "") {
    return null;
  }

  return (
    <div className="w-full relative overflow-hidden bg-gradient-to-r from-indigo-950/40 via-slate-900/40 to-cyan-950/40 border-b border-indigo-500/20 backdrop-blur-md text-slate-100 py-3.5 z-40 transition-all duration-300">
      {/* Neon Üst ve Alt Kılavuz Çizgileri */}
      <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent blur-[1px]" />
      <div className="absolute bottom-0 right-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent blur-[1px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3.5 w-full relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)] shrink-0">
            <AlertTriangle size={15} className="text-white animate-pulse" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed text-center sm:text-left">
            Sistemi tam yetkiyle kullanabilmek ve hızlı giriş yapabilmek için bir{" "}
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
              kullanıcı adı
            </span>{" "}
            belirlemelisiniz.
          </p>
        </div>

        {onActionClick ? (
          <button
            onClick={onActionClick}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0 border border-indigo-400/20"
          >
            Kullanıcı Adı Oluştur
          </button>
        ) : settingsUrl ? (
          <Link
            href={settingsUrl}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0 border border-indigo-400/20"
          >
            Kullanıcı Adı Oluştur
          </Link>
        ) : null}
      </div>
    </div>
  );
}
