"use client";

import { Wallet, History, Settings } from "lucide-react";

interface BottomNavigationBarProps {
  activeTab: "cuzdan" | "islemler" | "profil";
  setActiveTab: (tab: "cuzdan" | "islemler" | "profil") => void;
  setShowProfileModal: (val: boolean) => void;
}

export function BottomNavigationBar({
  activeTab,
  setActiveTab,
  setShowProfileModal,
}: BottomNavigationBarProps) {
  return (
    <nav className="md:hidden flex gap-1 px-4 pt-3 pb-7 bg-slate-950/90 border-t border-slate-900 backdrop-blur-lg fixed bottom-0 left-0 right-0 z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
      {/* Cüzdan / QR Butonu */}
      <button 
        onClick={() => setActiveTab("cuzdan")}
        aria-label="Cüzdan ve QR"
        className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-2xl transition-all text-[9px] font-black uppercase tracking-wider min-h-[44px] cursor-pointer border border-transparent"
        style={{ 
          background: activeTab === "cuzdan" ? "rgba(6, 182, 212, 0.08)" : "transparent", 
          color: activeTab === "cuzdan" ? "#22d3ee" : "#64748b" 
        }}
      >
        <Wallet size={16} />
        <span>Cüzdan/QR</span>
      </button>

      {/* İşlemlerim Butonu */}
      <button 
        onClick={() => setActiveTab("islemler")}
        aria-label="İşlemlerim"
        className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-2xl transition-all text-[9px] font-black uppercase tracking-wider min-h-[44px] cursor-pointer border border-transparent"
        style={{ 
          background: activeTab === "islemler" ? "rgba(6, 182, 212, 0.08)" : "transparent", 
          color: activeTab === "islemler" ? "#22d3ee" : "#64748b" 
        }}
      >
        <History size={16} />
        <span>İşlemlerim</span>
      </button>

      {/* Profil & Ayarlar Butonu */}
      <button 
        onClick={() => setShowProfileModal(true)}
        aria-label="Profil ve Ayarlar"
        className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-2xl transition-all text-[9px] font-black uppercase tracking-wider min-h-[44px] cursor-pointer border border-transparent"
        style={{ 
          background: "transparent", 
          color: "#64748b" 
        }}
      >
        <Settings size={16} />
        <span>Profil & Ayarlar</span>
      </button>
    </nav>
  );
}
export default BottomNavigationBar;
