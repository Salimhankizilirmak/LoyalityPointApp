/* eslint-disable @next/next/no-img-element */
"use client";

import { useCustomerDashboard } from "@/components/features/customer-dashboard/hooks/useCustomerDashboard";
import { DashboardLoadingScreen } from "@/components/dashboard/DashboardLoadingScreen";
import { ProfileSettingsModal } from "@/components/features/profile-settings/ui/ProfileSettingsModal";
import { QRCodeSVG } from "qrcode.react";
import { 
  Wallet, 
  History, 
  Settings, 
  QrCode, 
  LogOut, 
  Clock, 
  TrendingDown, 
  TrendingUp, 
  AlertCircle,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  CreditCard
} from "lucide-react";

interface CustomerDashboardClientPageProps {
  initialCustomerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    currentPoints: number;
    id: string;
    clerkId: string;
  } | null;
}

export function CustomerDashboardClientPage({
  initialCustomerData,
}: CustomerDashboardClientPageProps) {
  const { state, actions } = useCustomerDashboard(initialCustomerData);
  
  const { 
    activeTab, 
    ledgerTransactions, 
    paginatedTransactions,
    currentPage,
    totalPages,
    loading, 
    showProfileModal, 
    pts, 
    user, 
    isLoaded, 
    organization, 
    qrToken, 
    timeLeft,
    isMockData,
    isDarkMode
  } = state;

  const { 
    setActiveTab, 
    setShowProfileModal, 
    signOut,
    setIsMockData,
    toggleTheme,
    goToPage
  } = actions;

  if (loading || !isLoaded) {
    const displayName = user 
      ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.emailAddresses[0].emailAddress.split("@")[0]) 
      : null;
    return (
      <DashboardLoadingScreen
        userName={displayName}
        orgName={organization?.name || "Sadakat Paneli"}
        logoUrl={organization?.imageUrl || null}
      />
    );
  }

  // Dairesel Geri Sayım Çevresi Hesabı (r=18 için 2 * PI * r = 113.1)
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / 60) * circumference;

  // Clerk Kullanıcı Bilgileri
  const userAvatar = user?.imageUrl;
  const userFullName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "Müşteri";
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || "";

  return (
    <div className="flex-1 flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Profil Ayarları Modalı */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        isDarkMode={true}
      />

      {/* ───────────────────────────────────────────────────────────────────────
          MASAÜSTÜ SOL DİKEY MENÜ
      ───────────────────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-72 border-r border-slate-900 bg-slate-950/80 backdrop-blur-md p-6 sticky top-0 h-screen shrink-0 z-20">
        
        {/* ── Clerk Kullanıcı Kimlik İmzası ── */}
        <div className="flex items-center gap-3.5 px-2 mb-4 pb-5 border-b border-slate-800/50">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userFullName}
              className="w-11 h-11 rounded-2xl border border-cyan-500/25 object-cover shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-slate-900"
            />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center border border-cyan-400/20 text-white font-black text-sm shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              {userFullName.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-slate-100 truncate max-w-[170px]">
              {userFullName}
            </span>
            <span className="text-[10px] font-mono text-slate-500 truncate max-w-[170px]">
              {userEmail}
            </span>
          </div>
        </div>

        {/* Organizasyon Başlığı / Logo */}
        <div className="flex items-center gap-3.5 px-2 mb-8">
          {organization?.imageUrl ? (
            <img 
              src={organization.imageUrl} 
              alt={organization.name} 
              className="w-9 h-9 rounded-xl border border-cyan-500/20 object-cover shadow-[0_0_12px_rgba(6,182,212,0.1)] bg-slate-900"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center border border-cyan-400/20 text-white font-black text-xs shadow-[0_0_12px_rgba(6,182,212,0.2)]">
              {organization?.name?.substring(0, 2).toUpperCase() || "LP"}
            </div>
          )}
          <div className="flex flex-col">
            <h2 className="text-xs font-black tracking-wide text-slate-300 uppercase truncate max-w-[150px]">
              {organization?.name || "Müşteri Paneli"}
            </h2>
            <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-black">
              Sadakat Sistemi
            </span>
          </div>
        </div>

        {/* Navigasyon Elemanları */}
        <nav className="flex-1 space-y-2">
          {/* Cüzdan & QR Sekmesi */}
          <button
            onClick={() => setActiveTab("cuzdan")}
            className={`w-full flex items-center gap-3.5 px-4.5 py-4 rounded-2xl text-xs font-bold transition-all duration-300 relative group cursor-pointer ${
              activeTab === "cuzdan"
                ? "text-cyan-400 bg-cyan-950/20 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent"
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
            className={`w-full flex items-center gap-3.5 px-4.5 py-4 rounded-2xl text-xs font-bold transition-all duration-300 relative group cursor-pointer ${
              activeTab === "islemler"
                ? "text-cyan-400 bg-cyan-950/20 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent"
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
          {/* Mock Veri Toggle */}
          <button
            onClick={() => setIsMockData(!isMockData)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 border cursor-pointer ${
              isMockData 
                ? "bg-cyan-950/20 border-cyan-500/30 text-cyan-400" 
                : "bg-slate-900/40 border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>MOCK VERİLER</span>
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${isMockData ? "bg-cyan-500" : "bg-slate-700"}`}>
              <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 transform ${isMockData ? "translate-x-4" : "translate-x-0"}`} />
            </div>
          </button>

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

      {/* ───────────────────────────────────────────────────────────────────────
          ANA İÇERİK ALANI
      ───────────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6 relative overflow-x-hidden">
        {/* Ambient Neon Parlamalar */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-b from-cyan-500/5 via-indigo-500/0 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-gradient-to-t from-indigo-500/5 via-cyan-500/0 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* MOBİL GİRİŞ HEADER (Sadece Mobil) */}
        <div className="md:hidden flex items-center justify-between px-5 pt-7 pb-3 relative z-10">
          <div className="flex items-center gap-3">
            {organization?.imageUrl ? (
              <img 
                src={organization.imageUrl} 
                alt={organization.name} 
                className="w-8 h-8 rounded-xl object-cover border border-cyan-500/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-black shadow-lg">
                {organization?.name?.substring(0, 2).toUpperCase() || "LP"}
              </div>
            )}
            <h2 className="text-sm font-black tracking-tight uppercase truncate max-w-[180px]">
              {organization?.name || "Müşteri Paneli"}
            </h2>
          </div>
          {/* Mobil Kontroller: Tema, Mock & Ayarlar */}
          <div className="flex items-center gap-2">
            {/* Mock Toggle */}
            <button
              onClick={() => setIsMockData(!isMockData)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                isMockData
                  ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-400"
                  : "bg-slate-900 border-slate-800 text-slate-500"
              }`}
              title="Mock Veri Geçişi"
            >
              <QrCode size={14} className={isMockData ? "animate-pulse" : ""} />
            </button>

            {/* Tema Switch */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 active:scale-95 transition-all"
              title="Tema Değiştir"
            >
              {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
            </button>

            <button
              onClick={() => setShowProfileModal(true)}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 active:scale-95 transition-all"
              aria-label="Ayarlar"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>

        {/* SEKMELİ SAYFA GÖVDESİ */}
        <div className="flex-1 px-5 md:px-8 py-6 relative z-10 max-w-7xl w-full mx-auto">

          {/* ════════════════════════════════════════════════════════════════════
              CÜZDAN & QR SEKME GÖRÜNÜMÜ
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === "cuzdan" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch gap-6">

              {/* SOL SÜTUN: Premium Dijital Cüzdan Kartı & Canlı Anti-Fraud QR */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* PREMİUM DİJİTAL CÜZDAN KARTI (Arındırılmış — Sadece Loyalty Card + Puan) */}
                <div className="relative overflow-hidden rounded-3xl border border-cyan-500/35 bg-[#0b0f1d]/90 p-7 shadow-[0_0_35px_rgba(6,182,212,0.15)] flex flex-col justify-between min-h-[220px] group transition-all duration-500 hover:border-cyan-400/50">
                  {/* Kart Neon Süslemeleri */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                  
                  {/* Kart Üst Kılavuz — Sadece Loyalty Card Etiketi */}
                  <div className="flex justify-between items-start w-full relative z-10">
                    <div className="flex items-center gap-2.5">
                      <CreditCard size={16} className="text-cyan-400" />
                      <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase font-mono">
                        LOYALTY CARD
                      </span>
                    </div>
                    <Wallet className="text-cyan-400 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" size={22} />
                  </div>

                  {/* Merkezde Parlayan Sadakat Puan Göstergesi */}
                  <div className="my-6 relative z-10 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Mevcut Puan</span>
                    <span className="text-3xl sm:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-emerald-300 to-indigo-400 filter drop-shadow-[0_0_20px_rgba(34,211,238,0.3)] mt-1.5 font-mono">
                      ₺{(pts).toFixed(2)} Puan
                    </span>
                  </div>

                  {/* Kart Alt Bilgi */}
                  <div className="flex justify-between items-center w-full relative z-10 pt-4 border-t border-white/5 text-[9px] font-mono text-slate-500">
                    <span className="uppercase font-bold tracking-wider">GÜNCEL DURUM</span>
                    <span className="text-cyan-400/90 font-black tracking-widest uppercase">AKTİF HESAP</span>
                  </div>
                </div>

                {/* CANLI ANTİ-FRAUD QR KOD ALANI */}
                <div className="rounded-3xl border border-slate-900 bg-[#070913]/90 p-7 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-lg">
                  {/* Ambient blur */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent pointer-events-none" />

                  {/* QR Kod Başlığı */}
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shadow-[0_0_8px_rgba(34,211,238,0.8)] shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Anti-Fraud Reaktif QR Kod
                    </span>
                  </div>

                  {/* QR Kod Çerçevesi */}
                  <div className="relative p-5 rounded-2xl bg-white border border-cyan-400/20 shadow-[0_0_25px_rgba(34,211,238,0.1)] group-hover:scale-[1.01] transition-transform duration-300">
                    {qrToken ? (
                      <QRCodeSVG
                        value={qrToken}
                        size={170}
                        level="Q"
                        fgColor="#020617"
                        bgColor="#ffffff"
                      />
                    ) : (
                      <div className="w-[170px] h-[170px] flex items-center justify-center bg-slate-900 rounded-xl">
                        <QrCode size={40} className="text-slate-700 animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* QR Bilgilendirme */}
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-5 max-w-[280px]">
                    Kasiyere puan yükletmek veya harcatmak için bu QR kodu gösterin. Güvenliğiniz için bu kod her 60 saniyede bir otomatik yenilenir.
                  </p>

                  {/* Geri Sayım Animasyonu & Sayacı */}
                  <div className="flex items-center gap-3.5 mt-5 px-4.5 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                    {/* Dairesel Progress Bar */}
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <svg className="w-10 h-10 transform -rotate-90">
                        {/* Background track circle */}
                        <circle
                          cx="20"
                          cy="20"
                          r={radius}
                          className="text-slate-800"
                          strokeWidth="2.5"
                          stroke="currentColor"
                          fill="transparent"
                        />
                        {/* Front neon progress circle */}
                        <circle
                          cx="20"
                          cy="20"
                          r={radius}
                          className="text-cyan-400 transition-all duration-1000 ease-linear"
                          strokeWidth="2.5"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                        />
                      </svg>
                      {/* Geriye Kalan Saniye Sayacı */}
                      <span className="absolute text-[11px] font-black text-cyan-400 font-mono">
                        {timeLeft}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-start text-left">
                      <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest font-mono leading-none">
                        Anti-Fraud Shield
                      </span>
                      <span className="text-[9px] text-slate-500 mt-1">
                        Kodun geçerlilik süresi
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* SAĞ SÜTUN: Live Ledger Timeline (Fontlar Büyütülmüş) */}
              <div className="hidden md:block lg:col-span-7">
                <div className="rounded-3xl border border-slate-900 bg-[#070913]/90 p-7 h-full flex flex-col">
                  {/* Başlık */}
                  <div className="flex justify-between items-center pb-5 border-b border-slate-800/50 mb-6 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-md shadow-cyan-500/5">
                        <Clock size={15} />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">Canlı Hesap Defteri</h3>
                        <p className="text-xs text-slate-500">Mali hareketlerinizi anlık takip edin.</p>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Feed Gövdesi — Büyütülmüş Fontlar */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[500px] lg:max-h-[640px]">
                    {ledgerTransactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center text-slate-600 gap-3">
                        <History size={32} className="text-slate-800 stroke-[1.5]" />
                        <p className="text-sm font-semibold">Henüz herhangi bir işlem geçmişi bulunmamaktadır.</p>
                      </div>
                    ) : (
                      ledgerTransactions.map((tx) => {
                        const isVoided = tx.status === "VOIDED" || tx.type === "VOID";
                        
                        let Icon = Clock;
                        let iconBg = "bg-slate-900 border-slate-800 text-slate-400";
                        let typeLabel = "İşlem";

                        if (isVoided) {
                          Icon = AlertCircle;
                          iconBg = "bg-rose-950/20 border-rose-900/40 text-rose-400";
                          typeLabel = "İptal Edildi";
                        } else if (tx.type === "SPLIT_PAYMENT") {
                          Icon = Wallet;
                          iconBg = "bg-cyan-950/20 border-cyan-500/20 text-cyan-400";
                          typeLabel = "Parçalı Ödeme";
                        } else if (tx.type === "EARN") {
                          Icon = TrendingUp;
                          iconBg = "bg-emerald-950/20 border-emerald-500/20 text-emerald-400";
                          typeLabel = "Puan Yükleme";
                        } else if (tx.type === "BURN") {
                          Icon = TrendingDown;
                          iconBg = "bg-amber-950/20 border-amber-500/20 text-amber-400";
                          typeLabel = "Puan Harcama";
                        }

                        return (
                          <div 
                            key={tx.id}
                            className={`flex gap-4 p-5 rounded-2xl border border-slate-900/60 bg-[#09090f]/50 hover:bg-[#0a0f1d]/60 hover:border-slate-800/80 transition-all duration-300 relative group ${
                              isVoided ? "opacity-50 line-through" : ""
                            }`}
                          >
                            {/* Neon yan çizgi efekti */}
                            {!isVoided && (
                              <div className={`absolute top-5 bottom-5 left-0 w-[2px] rounded-r-full blur-[1px] ${
                                tx.type === "SPLIT_PAYMENT" ? "bg-cyan-500" :
                                tx.type === "EARN" ? "bg-emerald-500" : "bg-amber-500"
                              }`} />
                            )}

                            {/* İkon */}
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${iconBg}`}>
                              <Icon size={18} />
                            </div>

                            {/* Detaylar — Büyütülmüş Fontlar */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                              {/* Üst Satır */}
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex flex-col">
                                  <span className="text-lg font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                                    {tx.branchName}
                                  </span>
                                  <span className="text-xs font-mono text-slate-500 mt-0.5">
                                    {tx.createdAtFormatted}
                                  </span>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                  {isVoided ? (
                                    <span className="px-2.5 py-1 rounded-lg bg-rose-950/30 border border-rose-950 text-[9px] font-black uppercase tracking-wider text-rose-400">
                                      İPTAL EDİLDİ
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[9px] font-black uppercase tracking-wider text-slate-400">
                                      {typeLabel}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Bilgi Dökümü — Büyütülmüş */}
                              <div className="grid grid-cols-3 gap-3 py-3 px-4 rounded-xl bg-slate-950/50 border border-slate-900/60 text-center font-mono">
                                <div>
                                  <div className="text-[9px] text-slate-500 uppercase font-black">Toplam Tutar</div>
                                  <div className="text-xl font-bold text-slate-300 mt-1">
                                    ₺{tx.totalCartAmount.toFixed(2)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[9px] text-slate-500 uppercase font-black">Harcanan Puan</div>
                                  <div className={`text-xl font-bold mt-1 ${tx.pointsAmount > 0 && !isVoided ? "text-emerald-400" : "text-amber-400"}`}>
                                    {tx.pointsAmount > 0 ? `+${tx.pointsAmount}` : `${tx.pointsAmount}`} Pts
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[9px] text-slate-500 uppercase font-black">Ödenen Nakit</div>
                                  <div className="text-xl font-bold text-slate-300 mt-1">
                                    ₺{tx.amountSpent.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              İŞLEM GEÇMİŞİ SEKMESİ — Grid Kartlar + Sayfalama
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === "islemler" && (
            <div className="flex flex-col gap-6">
              {/* Başlık */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <History size={16} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">İşlem Geçmişim</h3>
                    <p className="text-xs text-slate-500">Tüm mali hareketlerinizi detaylı kartlar halinde inceleyin.</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 hidden sm:block">
                  {ledgerTransactions.length} kayıt bulundu
                </span>
              </div>

              {/* Grid Kartlar */}
              {paginatedTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center text-slate-600 gap-3 rounded-3xl border border-slate-900 bg-[#070913]/90">
                  <History size={40} className="text-slate-800 stroke-[1.5]" />
                  <p className="text-sm font-semibold">Henüz herhangi bir işlem geçmişi bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedTransactions.map((tx) => {
                    const isVoided = tx.status === "VOIDED" || tx.type === "VOID";
                    
                    let iconBg = "bg-slate-900 border-slate-800 text-slate-400";
                    let typeLabel = "İşlem";
                    let Icon = Clock;
                    let accentColor = "cyan";

                    if (isVoided) {
                      Icon = AlertCircle;
                      iconBg = "bg-rose-950/20 border-rose-900/40 text-rose-400";
                      typeLabel = "İptal Edildi";
                      accentColor = "rose";
                    } else if (tx.type === "SPLIT_PAYMENT") {
                      Icon = Wallet;
                      iconBg = "bg-cyan-950/20 border-cyan-500/20 text-cyan-400";
                      typeLabel = "Parçalı Ödeme";
                      accentColor = "cyan";
                    } else if (tx.type === "EARN") {
                      Icon = TrendingUp;
                      iconBg = "bg-emerald-950/20 border-emerald-500/20 text-emerald-400";
                      typeLabel = "Puan Yükleme";
                      accentColor = "emerald";
                    } else if (tx.type === "BURN") {
                      Icon = TrendingDown;
                      iconBg = "bg-amber-950/20 border-amber-500/20 text-amber-400";
                      typeLabel = "Puan Harcama";
                      accentColor = "amber";
                    }

                    return (
                      <div 
                        key={tx.id}
                        className={`relative rounded-2xl border bg-[#09090f]/60 p-5 flex flex-col gap-4 transition-all duration-300 hover:scale-[1.01] ${
                          isVoided 
                            ? "opacity-50 border-rose-950/40" 
                            : "border-slate-900/60 hover:border-slate-800/80 hover:shadow-lg hover:shadow-cyan-500/[0.03]"
                        }`}
                      >
                        {/* Kart Üst: Şube + Rozet */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${iconBg}`}>
                              <Icon size={16} />
                            </div>
                            <div className="min-w-0">
                              <h4 className={`text-base font-bold truncate ${isVoided ? "line-through text-slate-500" : "text-slate-200"}`}>
                                {tx.branchName}
                              </h4>
                              <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                                {tx.createdAtFormatted}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider shrink-0 border ${
                            isVoided 
                              ? "bg-rose-950/30 border-rose-950 text-rose-400"
                              : accentColor === "emerald" ? "bg-emerald-950/30 border-emerald-900/40 text-emerald-400"
                              : accentColor === "amber" ? "bg-amber-950/30 border-amber-900/40 text-amber-400"
                              : "bg-cyan-950/30 border-cyan-900/40 text-cyan-400"
                          }`}>
                            {isVoided ? "İPTAL EDİLDİ" : typeLabel}
                          </span>
                        </div>

                        {/* Kart Referans Kodu */}
                        {tx.refId && (
                          <div className="text-[10px] font-mono font-bold text-cyan-400/70 tracking-wider">
                            #{tx.refId}
                          </div>
                        )}

                        {/* Kart Finansal Kırılımlar */}
                        <div className={`grid grid-cols-3 gap-2 py-3 px-3 rounded-xl border text-center font-mono ${
                          isVoided ? "bg-slate-950/30 border-slate-900/40" : "bg-slate-950/50 border-slate-900/60"
                        }`}>
                          <div>
                            <div className="text-[8px] text-slate-500 uppercase font-black">Toplam</div>
                            <div className={`text-lg font-bold mt-0.5 ${isVoided ? "text-slate-600 line-through" : "text-slate-300"}`}>
                              ₺{tx.totalCartAmount.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[8px] text-slate-500 uppercase font-black">Puan</div>
                            <div className={`text-lg font-bold mt-0.5 ${
                              isVoided ? "text-slate-600 line-through" 
                              : tx.pointsAmount > 0 ? "text-emerald-400" : "text-amber-400"
                            }`}>
                              {tx.pointsAmount > 0 ? `+${tx.pointsAmount}` : `${tx.pointsAmount}`}
                            </div>
                          </div>
                          <div>
                            <div className="text-[8px] text-slate-500 uppercase font-black">Nakit</div>
                            <div className={`text-lg font-bold mt-0.5 ${isVoided ? "text-slate-600 line-through" : "text-slate-300"}`}>
                              ₺{tx.amountSpent.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sayfalama Kontrolleri */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold border transition-all duration-300 cursor-pointer ${
                      currentPage === 1
                        ? "bg-slate-900/40 border-slate-800/40 text-slate-600 cursor-not-allowed"
                        : "bg-slate-900/60 border-cyan-500/20 text-cyan-400 hover:bg-cyan-950/20 hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                    }`}
                  >
                    <ChevronLeft size={14} />
                    <span>Önceki</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                          page === currentPage
                            ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                            : "bg-slate-900/40 border border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/60"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold border transition-all duration-300 cursor-pointer ${
                      currentPage === totalPages
                        ? "bg-slate-900/40 border-slate-800/40 text-slate-600 cursor-not-allowed"
                        : "bg-slate-900/60 border-cyan-500/20 text-cyan-400 hover:bg-cyan-950/20 hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                    }`}
                  >
                    <span>Sonraki</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ───────────────────────────────────────────────────────────────────────
            MOBİL ALT NAVİGASYON ŞERİDİ (Bottom Navigation Bar)
        ───────────────────────────────────────────────────────────────────────── */}
        <nav className="md:hidden flex gap-1 px-4 pt-3 pb-7 bg-slate-950/90 border-t border-slate-900 backdrop-blur-lg fixed bottom-0 left-0 right-0 z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
          {/* Cüzdan / QR Butonu */}
          <button 
            onClick={() => setActiveTab("cuzdan")}
            aria-label="Cüzdan ve QR"
            className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-2xl transition-all text-[9px] font-black uppercase tracking-wider min-h-[44px] cursor-pointer"
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
            className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-2xl transition-all text-[9px] font-black uppercase tracking-wider min-h-[44px] cursor-pointer"
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
            className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-2xl transition-all text-[9px] font-black uppercase tracking-wider min-h-[44px] cursor-pointer"
            style={{ 
              background: "transparent", 
              color: "#64748b" 
            }}
          >
            <Settings size={16} />
            <span>Profil & Ayarlar</span>
          </button>
        </nav>
      </main>
    </div>
  );
}
export default CustomerDashboardClientPage;
