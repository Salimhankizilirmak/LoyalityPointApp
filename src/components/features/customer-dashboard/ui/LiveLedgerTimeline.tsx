"use client";

import { Clock, History, AlertCircle, Wallet, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react";
import { LedgerTransaction } from "../hooks/useCustomerDashboard";

interface LiveLedgerTimelineProps {
  activeTab: "cuzdan" | "islemler" | "profil";
  ledgerTransactions: LedgerTransaction[];
  paginatedTransactions: LedgerTransaction[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// ALT BİLEŞEN 1: DİKEY CANLI TIMELINE GÖRÜNÜMÜ
// ─────────────────────────────────────────────────────────────────────────────
function LedgerTimelineView({ ledgerTransactions }: { ledgerTransactions: LedgerTransaction[] }) {
  if (ledgerTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-slate-600 gap-3">
        <Clock size={32} className="text-slate-800 stroke-[1.5]" />
        <p className="text-xs font-semibold">Henüz herhangi bir işlem geçmişi bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[500px] lg:max-h-[640px]">
      {ledgerTransactions.map((tx) => {
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
            {!isVoided && (
              <div className={`absolute top-4 bottom-4 left-0 w-[2px] rounded-r-full blur-[1px] ${
                tx.type === "SPLIT_PAYMENT" ? "bg-cyan-500" :
                tx.type === "EARN" ? "bg-emerald-500" : "bg-amber-500"
              }`} />
            )}

            {/* İkon */}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${iconBg}`}>
              <Icon size={18} />
            </div>

            {/* Detaylar */}
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col">
                  <span className="text-lg font-black text-slate-100 group-hover:text-white transition-colors truncate">
                    {tx.branchName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                    {tx.createdAtFormatted}
                  </span>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  {isVoided ? (
                    <span className="px-2.5 py-1 rounded-md bg-rose-950/30 border border-rose-900/50 text-[9px] font-black uppercase tracking-wider text-rose-400">
                      İPTAL EDİLDİ
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-[9px] font-black uppercase tracking-wider text-slate-400">
                      {typeLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Bilgi Dökümü */}
              <div className="grid grid-cols-3 gap-3 py-2.5 px-4 rounded-xl bg-slate-950/50 border border-slate-900/60 text-center font-mono">
                <div>
                  <div className="text-[9px] text-slate-500 uppercase font-black">Toplam Tutar</div>
                  <div className="text-xl font-bold text-slate-200 mt-0.5">
                    ₺{tx.totalCartAmount.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase font-black">Harcanan Puan</div>
                  <div className={`text-xl font-bold mt-0.5 ${tx.pointsAmount > 0 && !isVoided ? "text-emerald-400" : "text-amber-400"}`}>
                    {tx.pointsAmount > 0 ? `+${tx.pointsAmount}` : `${tx.pointsAmount}`} Pts
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase font-black">Ödenen Nakit</div>
                  <div className="text-xl font-bold text-slate-200 mt-0.5">
                    ₺{tx.amountSpent.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ALT BİLEŞEN 2: ÜÇLÜ GRID İŞLEM GEÇMİŞİ VE SAYFALAMA
// ─────────────────────────────────────────────────────────────────────────────
function LedgerGridView({
  paginatedTransactions,
  currentPage,
  totalPages,
  setCurrentPage,
}: {
  paginatedTransactions: LedgerTransaction[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
}) {
  if (paginatedTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-slate-600 gap-3">
        <History size={36} className="text-slate-800 stroke-[1.5]" />
        <p className="text-sm font-semibold">Henüz herhangi bir işlem geçmişi bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Üçlü Grid Yapısı */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedTransactions.map((tx) => {
          const isVoided = tx.status === "VOIDED" || tx.type === "VOID";
          
          let typeLabel = "İşlem";
          let badgeColor = "bg-slate-900/80 border-slate-800 text-slate-400";
          
          if (isVoided) {
            typeLabel = "İptal Edildi";
            badgeColor = "bg-rose-950/30 border-rose-900/40 text-rose-400";
          } else if (tx.type === "SPLIT_PAYMENT") {
            typeLabel = "Parçalı Ödeme";
            badgeColor = "bg-cyan-950/20 border-cyan-500/20 text-cyan-400";
          } else if (tx.type === "EARN") {
            typeLabel = "Puan Yükleme";
            badgeColor = "bg-emerald-950/20 border-emerald-500/20 text-emerald-400";
          } else if (tx.type === "BURN") {
            typeLabel = "Puan Harcama";
            badgeColor = "bg-amber-950/20 border-amber-500/20 text-amber-400";
          }

          return (
            <div 
              key={tx.id}
              className={`p-5 rounded-2xl border border-slate-900 bg-[#09090f]/60 hover:bg-[#0a0f1d]/50 transition-all duration-300 flex flex-col justify-between gap-4 ${
                isVoided ? "opacity-50 line-through" : ""
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-black text-slate-200 truncate">{tx.branchName}</span>
                  <span className="text-[10px] font-mono text-slate-500 mt-1">{tx.createdAtFormatted}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0 border ${badgeColor}`}>
                  {typeLabel}
                </span>
              </div>

              {/* Bilgi Listesi */}
              <div className="space-y-2 py-3 px-4 rounded-xl bg-slate-950/60 border border-slate-900 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-black text-[9px] uppercase">Toplam Sepet</span>
                  <span className="font-bold text-slate-200">₺{tx.totalCartAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-black text-[9px] uppercase">Harcanan Puan</span>
                  <span className={`font-bold ${tx.pointsAmount > 0 && !isVoided ? "text-emerald-400" : "text-amber-400"}`}>
                    {tx.pointsAmount > 0 ? `+${tx.pointsAmount}` : `${tx.pointsAmount}`} Pts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-black text-[9px] uppercase">Ödenen Nakit</span>
                  <span className="font-bold text-slate-200">₺{tx.amountSpent.toFixed(2)}</span>
                </div>
              </div>

              {/* Alt Kısım */}
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-900/60">
                <span className="font-bold">{tx.refId || "#REF-SISTEM"}</span>
                <span>AKTİF</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sayfalama Butonları */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-slate-900">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:border-slate-800 transition-all font-bold text-xs cursor-pointer"
          >
            <ChevronLeft size={14} />
            <span>Önceki</span>
          </button>

          <span className="text-xs font-mono font-bold text-slate-400">
            Sayfa <span className="text-cyan-400">{currentPage}</span> / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:border-slate-800 transition-all font-bold text-xs cursor-pointer"
          >
            <span>Sonraki</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANA BİLEŞEN: LİSTELEME ORKESTRATÖRÜ
// ─────────────────────────────────────────────────────────────────────────────
export function LiveLedgerTimeline({
  activeTab,
  ledgerTransactions,
  paginatedTransactions,
  currentPage,
  totalPages,
  setCurrentPage,
}: LiveLedgerTimelineProps) {
  if (activeTab === "cuzdan") {
    return (
      <div className="rounded-3xl border border-slate-900 bg-[#070913]/90 p-7 h-full flex flex-col">
        {/* Başlık */}
        <div className="flex justify-between items-center pb-5 border-b border-slate-800/50 mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-md shadow-cyan-500/5">
              <Clock size={15} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Canlı Hesap Defteri</h3>
              <p className="text-[10px] text-slate-500">Mali hareketlerinizi anlık takip edin.</p>
            </div>
          </div>
        </div>

        {/* Timeline Akışı */}
        <LedgerTimelineView ledgerTransactions={ledgerTransactions} />
      </div>
    );
  }

  // İşlemler sekmesi - Üçlü Grid Sayfalama Görünümü
  return (
    <div className="rounded-3xl border border-slate-900 bg-[#070913]/90 p-6 md:p-8 flex flex-col min-h-[500px]">
      <div className="flex justify-between items-center pb-5 border-b border-slate-800/50 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <History size={16} />
          </div>
          <div>
            <h3 className="text-base font-black text-white">İşlem Geçmişi</h3>
            <p className="text-xs text-slate-500">Tüm geçmiş harcamalarınızı ve puan hareketlerinizi listeleyin.</p>
          </div>
        </div>
      </div>

      {/* Grid Listesi */}
      <LedgerGridView
        paginatedTransactions={paginatedTransactions}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
}
export default LiveLedgerTimeline;
