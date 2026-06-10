"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface UsernameWarningBannerProps {
  username?: string | null;
  onActionClick?: () => void;
}

export default function UsernameWarningBanner({
  username,
}: UsernameWarningBannerProps) {
  const pathname = usePathname() || "";
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Hydration bitene kadar veya kullanıcı adı zaten tanımlıysa hiçbir şey render etme
  if (!isMounted || (username && username.trim() !== "")) {
    return null;
  }

  // Dinamik Rota Belirleyici: Kullanıcının hangi dashboard segmentinde olduğunu strictly tespit et
  let targetSettingsUrl = "/dashboard"; // Fallback güvenli liman
  
  if (pathname.startsWith("/boss-dashboard")) {
    targetSettingsUrl = "/boss-dashboard/settings";
  } else if (pathname.startsWith("/manager-dashboard")) {
    targetSettingsUrl = "/manager-dashboard/settings";
  } else if (pathname.startsWith("/cashier-dashboard")) {
    targetSettingsUrl = "/cashier-dashboard/settings";
  } else if (pathname.startsWith("/customer-dashboard")) {
    targetSettingsUrl = "/customer-dashboard/settings";
  }

  return (
    <div className="w-full block relative overflow-hidden bg-gradient-to-r from-indigo-950/50 via-slate-900/50 to-cyan-950/50 border-b border-indigo-500/30 backdrop-blur-md text-slate-100 py-3 w-full z-50 transition-all duration-300">
      {/* Neon Üst ve Alt Kılavuz Çizgileri */}
      <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent blur-[1px]" />
      <div className="absolute bottom-0 right-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent blur-[1px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3.5 w-full relative z-10">
        <div className="flex items-center gap-3">
          <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed text-center sm:text-left">
            Sistemi tam yetkiyle kullanabilmek ve hızlı giriş yapabilmek için bir{" "}
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
              kullanıcı adı
            </span>{" "}
            belirlemelisiniz.
          </p>
        </div>

        <Link
          href={targetSettingsUrl}
          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0 border border-indigo-400/20 text-center flex items-center justify-center"
        >
          Kullanıcı Adı Oluştur
        </Link>
      </div>
    </div>
  );
}
