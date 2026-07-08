"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, CreditCard, ChevronRight, AlertCircle } from "lucide-react";
import { CustomerData, TxType } from "../hooks/useCashierDashboard";

interface CashierTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerData | null;
  txType: TxType;
  setTxType: (type: TxType) => void;
  amount: string;
  setAmount: (val: string) => void;
  totalCartAmount: string;
  setTotalCartAmount: (val: string) => void;
  ptsPreview: number;
  isPending: boolean;
  txError: string;
  handleTx: () => Promise<void>;
  isDarkMode: boolean;
  activeCampaign?: any;
}

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

export function CashierTransactionModal({
  isOpen,
  onClose,
  customer,
  txType,
  setTxType,
  amount,
  setAmount,
  totalCartAmount,
  setTotalCartAmount,
  ptsPreview,
  isPending,
  txError,
  handleTx,
  isDarkMode,
  activeCampaign,
}: CashierTransactionModalProps) {
  if (!customer) return null;

  const isEarn = txType === "EARN";

  // Dinamik Temalandırma Sınıfları (Mor Kesinlikle Yasaktır)
  const themeClasses = {
    glow: isEarn ? "bg-cyan-500/5" : "bg-amber-500/5",
    border: isEarn ? "border-cyan-500/20" : "border-amber-500/20",
    focusedBorder: isEarn ? "focus:border-cyan-500/80" : "focus:border-amber-500/80",
    shadow: isEarn ? "focus:shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "focus:shadow-[0_0_15px_rgba(245,158,11,0.15)]",
    tabActive: isEarn 
      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]" 
      : "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]",
    badge: isEarn
      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
      : "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    button: isEarn
      ? "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-[0_4px_15px_rgba(8,145,178,0.2)]"
      : "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-[0_4px_15px_rgba(217,119,6,0.2)]",
  };

  // Katı validasyon kontrolü (Strict Validation Chain)
  const totalCartNum = Number(totalCartAmount);
  const amountNum = Number(amount);

  const isInvalid = isEarn
    ? (!amount || amountNum <= 0 || isNaN(amountNum))
    : (!amount || !totalCartAmount || amountNum <= 0 || totalCartNum <= 0 || isNaN(amountNum) || isNaN(totalCartNum) || amountNum > customer.pts || amountNum > totalCartNum);

  let upsellMessage = null;
  if (isEarn && activeCampaign && activeCampaign.campaignType === "tiered" && amountNum > 0) {
    const tiersStr = activeCampaign.tiers;
    const tiers = typeof tiersStr === 'string' ? JSON.parse(tiersStr) : tiersStr;
    if (Array.isArray(tiers)) {
      const sortedTiers = tiers.sort((a: any, b: any) => a.limit - b.limit);
      const nextTier = sortedTiers.find((t: any) => t.limit > amountNum);
      if (nextTier) {
        const diff = nextTier.limit - amountNum;
        upsellMessage = `Müşteri şu anda ${ptsPreview} Puan kazanıyor. Sepete ${fmt(diff)} TL'lik daha ürün eklerse toplam ${nextTier.points} Puan kazanabilir!`;
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md pointer-events-auto"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className={`w-full max-w-md rounded-3xl border p-5 relative overflow-hidden flex flex-col justify-between shadow-2xl transition-colors duration-300 ${
              isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"
            } ${themeClasses.border}`}
          >
            {/* Dinamik Arka Plan Parlaması */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-colors duration-300 ${themeClasses.glow}`} />

            {/* Modal Başlık */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5 relative z-10">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                  isEarn ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                }`}>
                  {isEarn ? <Coins size={16} /> : <CreditCard size={16} />}
                </div>
                <div>
                  <h3 className="text-[12px] font-black uppercase tracking-wider">Kasa İşlemi</h3>
                  <p className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                    Müşteri: {customer.name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                  isDarkMode 
                    ? "bg-white/[0.02] border-white/[0.05] hover:bg-white/5 text-slate-400 hover:text-white" 
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500"
                }`}
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal İçerik */}
            <div className="space-y-4 py-4 relative z-10">
              {/* Tab/Toggle Yapısı */}
              <div className="space-y-1">
                <label className={`text-[10px] font-black uppercase tracking-widest block ${isDarkMode ? "text-slate-500" : "text-slate-600"}`}>
                  İşlem Tipi Seçimi
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950/20 p-1 rounded-2xl border border-white/5">
                  <button
                    onClick={() => { setTxType("EARN"); setAmount(""); setTotalCartAmount(""); }}
                    className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border min-h-[34px] cursor-pointer ${
                      isEarn 
                        ? themeClasses.tabActive
                        : isDarkMode ? "bg-transparent border-transparent text-slate-400 hover:text-slate-200" : "bg-transparent border-transparent text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Coins size={12} />
                    Puan Yükle (Earn)
                  </button>

                  <button
                    onClick={() => { setTxType("BURN"); setAmount(""); setTotalCartAmount(""); }}
                    className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border min-h-[34px] cursor-pointer ${
                      !isEarn 
                        ? themeClasses.tabActive
                        : isDarkMode ? "bg-transparent border-transparent text-slate-400 hover:text-slate-200" : "bg-transparent border-transparent text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <CreditCard size={12} />
                    Puan Harca (Burn)
                  </button>
                </div>
              </div>

              {/* Tutar / Puan Girdi Alanları */}
              {isEarn ? (
                <div className="space-y-1">
                  <label className={`text-[10px] font-black uppercase tracking-widest block ${isDarkMode ? "text-slate-500" : "text-slate-600"}`}>
                    Alışveriş Tutarı (₺)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ödeme tutarını giriniz..."
                    className={`w-full px-3 py-2 text-[10px] font-bold border rounded-xl outline-none transition-all min-h-[36px] ${
                      isDarkMode
                        ? "bg-[#09090b]/80 border-white/10 text-white focus:shadow-none"
                        : "bg-slate-50 border-slate-200 text-slate-900 focus:shadow-none"
                    } ${themeClasses.focusedBorder} ${themeClasses.shadow}`}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className={`text-[10px] font-black uppercase tracking-widest block ${isDarkMode ? "text-slate-500" : "text-slate-600"}`}>
                      Toplam Alışveriş Tutarı (TL)
                    </label>
                    <input
                      type="number"
                      value={totalCartAmount}
                      onChange={(e) => setTotalCartAmount(e.target.value)}
                      placeholder="Toplam sepet tutarı..."
                      className={`w-full px-3 py-2 text-[10px] font-bold border rounded-xl outline-none transition-all min-h-[36px] ${
                        isDarkMode
                          ? "bg-[#09090b]/80 border-white/10 text-white focus:shadow-none"
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:shadow-none"
                      } ${themeClasses.focusedBorder} ${themeClasses.shadow}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[10px] font-black uppercase tracking-widest block ${isDarkMode ? "text-slate-500" : "text-slate-600"}`}>
                      Harcatılacak Puan (1 Puan = 1 TL)
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`Maksimum bakiye: ${customer.pts}`}
                      className={`w-full px-3 py-2 text-[10px] font-bold border rounded-xl outline-none transition-all min-h-[36px] ${
                        isDarkMode
                          ? "bg-[#09090b]/80 border-white/10 text-white focus:shadow-none"
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:shadow-none"
                      } ${themeClasses.focusedBorder} ${themeClasses.shadow}`}
                    />
                  </div>
                </div>
              )}

              {/* Dinamik Puan Önizlemesi (Yalnızca Puan Yükleme Eylemi İçin) */}
              {isEarn && ptsPreview > 0 && (
                <div className="space-y-2">
                  <div className={`flex items-center justify-between p-2 rounded-xl border transition-colors duration-300 ${themeClasses.badge}`}>
                    <span className="text-[10px] font-black uppercase tracking-wider font-mono">
                      Kazanılacak Puan
                    </span>
                    <span className="text-[10px] font-bold font-mono">
                      +{fmt(ptsPreview)} Pts
                    </span>
                  </div>
                  {upsellMessage && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-medium leading-relaxed">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>💡 <strong>Fırsat:</strong> {upsellMessage}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Reaktif Parçalı Tahsilat (Split Payment) Özeti */}
              {!isEarn && totalCartNum > 0 && amountNum > 0 && (
                <div className="p-3 rounded-2xl border text-[10px] font-semibold space-y-1.5 transition-all bg-amber-500/10 border-amber-500/20 text-amber-400">
                  <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-wider">
                    <span>Finansal Özet (Parçalı Tahsilat)</span>
                    <span className="font-mono text-amber-500 font-bold">1 Pts = 1 TL</span>
                  </div>
                  <div className="border-t border-dashed border-amber-500/20 my-1" />
                  <p className="leading-relaxed text-[10px]">
                    <span className="font-black text-white">{fmt(totalCartNum)} TL</span> değerindeki alışveriş için <span className="font-black text-white">{fmt(amountNum)} Puan</span> düşülecek, kalan <span className="font-black text-white">{fmt(Math.max(0, totalCartNum - amountNum))} TL</span> nakit/kart olarak tahsil edilecek.
                  </p>
                </div>
              )}

              {/* Hata Durumu */}
              {txError && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 text-[10px] font-semibold">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{txError}</span>
                </div>
              )}
            </div>

            {/* Modal Onay Butonları */}
            <div className="relative z-10 pt-2 border-t border-white/5 flex gap-2">
              <button
                onClick={onClose}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all border min-h-[38px] cursor-pointer ${
                  isDarkMode 
                    ? "bg-slate-800 hover:bg-slate-700 border-white/5 text-slate-300" 
                    : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                }`}
              >
                İptal Et
              </button>
              
              <button
                onClick={handleTx}
                disabled={isInvalid || isPending}
                className={`flex-[2] py-2.5 rounded-xl font-bold text-[10px] text-white transition-all flex items-center justify-center gap-1.5 min-h-[38px] disabled:opacity-40 disabled:cursor-not-allowed ${themeClasses.button}`}
              >
                <span>{isPending ? "İşlem Yürütülüyor..." : "İşlemi Tamamla"}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
