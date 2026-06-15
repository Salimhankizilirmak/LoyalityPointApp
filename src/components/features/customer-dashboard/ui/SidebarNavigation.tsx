/* eslint-disable @next/next/no-img-element */
"use client";

import { Wallet, History, Settings, Moon, Sun, LogOut } from "lucide-react";

interface SidebarNavigationProps {
  activeTab: "cuzdan" | "islemler" | "profil";
  setActiveTab: (tab: "cuzdan" | "islemler" | "profil") => void;
  userFullName: string;
  userEmail: string;
  userAvatar: string;

  isDarkMode: boolean;
  toggleTheme: () => void;
  signOut: () => Promise<void>;
  setShowProfileModal: (val: boolean) => void;
}

export function SidebarNavigation({
  activeTab,
  setActiveTab,
  userFullName,
  userEmail,
  userAvatar,

  isDarkMode,
  toggleTheme,
  signOut,
  setShowProfileModal,
}: SidebarNavigationProps) {
  return (
    <aside className="hidden md:flex flex-col w-72 border-r border-slate-900 bg-slate-950/80 backdrop-blur-md p-6 sticky top-0 h-screen shrink-0 z-20">
      
      {/* Kullanıcı Kimlik Bilgileri Entegrasyonu */}
      <div className="flex items-center gap-3.5 px-2 pb-6 mb-6 border-b border-slate-900">
        {userAvatar ? (
          <img 
            src={userAvatar} 
            alt={userFullName} 
            className="w-11 h-11 rounded-2xl border border-cyan-500/20 object-cover shadow-[0_0_15px_rgba(6,182,212,0.1)] bg-slate-900"
          />
        ) : (
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center border border-cyan-400/20 text-white font-black shadow-[0_0_15px_rgba(6,182,212,0.2)] text-sm">
            {userFullName.substring(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <h2 className="text-xs font-black tracking-wide text-slate-100 uppercase truncate">
            {userFullName}
          </h2>
          <span className="text-[9px] font-mono text-cyan-400 truncate">
            {userEmail}
          </span>
        </div>
      </div>

      {/* Navigasyon Elemanları */}
      <nav className="flex-1 space-y-2">
        {/* Cüzdan & QR Sekmesi */}
        <button
          onClick={() => setActiveTab("cuzdan")}
          className={`w-full flex items-center gap-3.5 px-4.5 py-4 rounded-2xl text-xs font-bold transition-all duration-300 relative group cursor-pointer border border-transparent ${
            activeTab === "cuzdan"
              ? "text-cyan-400 bg-cyan-950/20 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
          }`}
        >
          <Wallet size={16} className={activeTab === "cuzdan" ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-300"} />
          <span>Cüzdanım & QR Kodum</span>
          {activeTab === "cuzdan" && (
            <span className="absolute right-4.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          )}
        </button>

        {/* İşlemlerim Sekmesi */}
        <button
          onClick={() => setActiveTab("islemler")}
          className={`w-full flex items-center gap-3.5 px-4.5 py-4 rounded-2xl text-xs font-bold transition-all duration-300 relative group cursor-pointer border border-transparent ${
            activeTab === "islemler"
              ? "text-cyan-400 bg-cyan-950/20 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
          }`}
        >
          <History size={16} className={activeTab === "islemler" ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-300"} />
          <span>İşlem Geçmişim</span>
          {activeTab === "islemler" && (
            <span className="absolute right-4.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          )}
        </button>

        {/* Profil & Ayarlar Tetikleyici */}
        <button
          onClick={() => setShowProfileModal(true)}
          className="w-full flex items-center gap-3.5 px-4.5 py-4 rounded-2xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent transition-all duration-300 cursor-pointer"
        >
          <Settings size={16} className="text-slate-400 group-hover:text-slate-300" />
          <span>Profil ve Ayarlar</span>
        </button>
      </nav>

      {/* Mock & Tema Kontrolleri */}
      <div className="pt-6 border-t border-slate-900/60 space-y-3">


        {/* Tema Değiştirme Butonu */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent transition-all duration-300 cursor-pointer"
        >
          <span>TEMA SEÇİMİ</span>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-cyan-400">
            {isDarkMode ? <Moon size={13} /> : <Sun size={13} />}
          </div>
        </button>
      </div>

      {/* Çıkış Yap Butonu */}
      <div className="pt-6 border-t border-slate-900">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3.5 px-4.5 py-4 rounded-2xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/10 transition-all duration-300 cursor-pointer"
        >
          <LogOut size={16} />
          <span>Oturumu Kapat</span>
        </button>
      </div>
    </aside>
  );
}
export default SidebarNavigation;
