"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Calculator, Coins, Loader2, Tag, CheckCircle2 } from "lucide-react";
import { earnPointsAction, addDirectPointsAction } from "@/app/(cashier)/cashier-dashboard/actions";

interface Campaign {
  id: string;
  name: string;
  earnRatio: number;
  campaignType: string;
  tiers: any;
}

interface EarnConfig {
  defaultEarnRatio: number;
  pointsEquivalent: number;
  tlEquivalent: number;
  campaigns: Campaign[];
}

interface EarnPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  config: EarnConfig | null;
  onSuccess: (message: string, newTotal?: number) => void;
}

export function EarnPointsModal({ isOpen, onClose, customer, config, onSuccess }: EarnPointsModalProps) {
  const [activeTab, setActiveTab] = useState<"qr" | "manual">("manual");
  const [inputType, setInputType] = useState<"tl" | "points">("tl");
  const [amountInput, setAmountInput] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setAmountInput("");
      setSelectedCampaignId(null);
      setError(null);
      setActiveTab("manual");
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Hesaplama
  const amountNumber = parseFloat(amountInput) || 0;
  
  let currentEarnRatio = config?.defaultEarnRatio || 10;
  let campaignType = "multiplier";
  let activeCampaign = null;

  if (selectedCampaignId && config?.campaigns) {
    const c = config.campaigns.find(c => c.id === selectedCampaignId);
    if (c) {
      activeCampaign = c;
      currentEarnRatio = c.earnRatio;
      campaignType = c.campaignType;
    }
  }

  let calculatedPoints = 0;
  let finalAmountInKurus = 0;
  const pointsEq = config?.pointsEquivalent || 1;
  const tlEq = config?.tlEquivalent || 1;

  if (inputType === "tl") {
    finalAmountInKurus = Math.floor(amountNumber * 100);
    
    if (campaignType === "tiered" && activeCampaign) {
      const tiersStr = activeCampaign.tiers;
      const tiers = typeof tiersStr === 'string' ? JSON.parse(tiersStr) : tiersStr;
      if (Array.isArray(tiers)) {
        const validTiers = tiers.filter((t: any) => amountNumber >= t.limit).sort((a: any, b: any) => b.limit - a.limit);
        if (validTiers.length > 0) {
          calculatedPoints = validTiers[0].points;
        }
      }
    } else {
      const tlDegeri = Math.floor((finalAmountInKurus * currentEarnRatio) / 100);
      calculatedPoints = Math.floor((tlDegeri / 100) * (pointsEq / tlEq));
    }
  } else {
    // Direkt Puan (Reverse Math kaldırıldı, saf puan)
    calculatedPoints = Math.floor(amountNumber);
  }

  const handleEarnPoints = async () => {
    if (amountNumber <= 0) {
      setError("Lütfen geçerli bir tutar girin.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    let res;
    if (inputType === "tl") {
      res = await earnPointsAction(customer.id, finalAmountInKurus, selectedCampaignId || undefined);
    } else {
      res = await addDirectPointsAction(customer.id, calculatedPoints);
    }
    
    if (res && !res.success) {
      setError(res.error || "İşlem başarısız.");
      setIsSubmitting(false);
    } else if (res && res.success) {
      onSuccess(res.message || `${calculatedPoints} Puan yüklendi.`, res.newTotal);
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  if (isSuccess) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-sm bg-emerald-950/90 border border-emerald-500/30 shadow-2xl shadow-emerald-900/20 rounded-2xl p-8 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">İşlem Başarılı!</h3>
            <p className="text-emerald-200/80 text-sm">Puan kazanma işlemi tamamlandı.</p>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-16 pb-4 sm:p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-800/50">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Coins className="text-amber-400" />
                Puan Kazan
              </h2>
              <p className="text-sm text-slate-400 mt-1">Müşteri: <span className="text-white font-medium">{customer.name}</span> ({customer.phone})</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex p-2 bg-slate-900 border-b border-white/5">
            <button
              onClick={() => setActiveTab("manual")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === "manual" ? "bg-indigo-500/20 text-indigo-400" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Calculator size={18} />
              Manuel Tutar
            </button>
            <button
              onClick={() => setActiveTab("qr")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === "qr" ? "bg-indigo-500/20 text-indigo-400" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800"
              }`}
            >
              <QrCode size={18} />
              QR Okut (Fiş)
            </button>
          </div>

          {/* Content */}
          <div className="p-6 flex-1 min-h-[350px]">
            {activeTab === "qr" ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center relative overflow-hidden">
                  <motion.div 
                    animate={{ y: ["-100%", "100%"] }} 
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent opacity-50"
                  />
                  <QrCode size={48} className="text-slate-500 relative z-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Çok Yakında Hizmetinizde</h3>
                  <p className="text-slate-400 max-w-sm mx-auto">
                    Yetkili servis entegrasyonu tamamlandığında, fiş üzerindeki QR kodu kameraya veya el terminaline okutarak otomatik puan yükleyebileceksiniz.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full space-y-6">
                
                {/* Tutar / Puan Girişi */}
                <div className="text-center">
                  <div className="flex bg-slate-800 p-1 rounded-xl w-full max-w-xs mx-auto mb-4">
                    <button
                      onClick={() => setInputType("tl")}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${inputType === "tl" ? "bg-indigo-500 text-white shadow" : "text-slate-400 hover:text-slate-300"}`}
                    >
                      Alışveriş (TL)
                    </button>
                    <button
                      onClick={() => setInputType("points")}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${inputType === "points" ? "bg-amber-500 text-white shadow" : "text-slate-400 hover:text-slate-300"}`}
                    >
                      Direkt Puan
                    </button>
                  </div>

                  <div className="relative max-w-xs mx-auto">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-light text-slate-500">
                      {inputType === "tl" ? "₺" : "P"}
                    </span>
                    <input
                      type="number"
                      autoFocus
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      placeholder={inputType === "tl" ? "0.00" : "0"}
                      className="w-full bg-slate-950 border-2 border-slate-800 focus:border-indigo-500 rounded-2xl py-4 pl-12 pr-4 text-4xl font-black text-white text-center shadow-inner transition-colors outline-none"
                    />
                  </div>
                  {amountNumber > 0 && inputType === "tl" && (
                    <p className="text-sm text-slate-400 mt-3 font-medium bg-slate-900/50 p-2 rounded-lg border border-white/5">
                      <span className="text-white">{amountNumber} TL</span> değerindeki alışveriş karşılığında <span className="text-indigo-400">{calculatedPoints} Puan</span> yüklenecektir.
                    </p>
                  )}
                  {amountNumber > 0 && inputType === "points" && (
                    <p className="text-sm text-slate-400 mt-3 font-medium bg-slate-900/50 p-2 rounded-lg border border-white/5">
                      Sisteme direkt olarak <span className="text-amber-400">{calculatedPoints} Puan</span> eklenecektir.
                    </p>
                  )}
                </div>

                {/* Kampanyalar */}
                {config && config.campaigns && config.campaigns.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                      <Tag size={16} /> Aktif Kampanyalar
                    </label>
                    <div className="flex overflow-x-auto pb-2 gap-3 snap-x no-scrollbar">
                      <button
                        onClick={() => setSelectedCampaignId(null)}
                        className={`flex-none px-4 py-3 rounded-xl border snap-start transition-all ${
                          selectedCampaignId === null 
                            ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" 
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-sm">Standart Puan</span>
                          {selectedCampaignId === null && <CheckCircle2 size={16} className="text-indigo-400" />}
                        </div>
                      </button>
                      
                      {config.campaigns.map((camp) => (
                        <button
                          key={camp.id}
                          onClick={() => setSelectedCampaignId(camp.id)}
                          className={`flex-none px-4 py-3 rounded-xl border snap-start transition-all min-w-[160px] text-left ${
                            selectedCampaignId === camp.id 
                              ? "bg-amber-500/20 border-amber-500 text-amber-300" 
                              : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-sm line-clamp-1">{camp.name}</span>
                            {selectedCampaignId === camp.id && <CheckCircle2 size={16} className="text-amber-400" />}
                          </div>
                          <span className="text-xs opacity-70">
                            {camp.campaignType === "tiered" ? "Kademeli Puan" : `X${camp.earnRatio / 10} Çarpan`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sonuç Alanı */}
                <div className="mt-auto pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20">
                    <div>
                      <p className="text-sm text-indigo-300 font-medium mb-1">Kazanılacak Toplam Puan</p>
                      <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-white">{calculatedPoints}</span>
                        <span className="text-lg font-bold text-indigo-400 mb-1 pb-0.5">Puan</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleEarnPoints}
                      disabled={isSubmitting || amountNumber <= 0}
                      className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/25 disabled:shadow-none"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          İşleniyor...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={20} />
                          Puanı Yükle
                        </>
                      )}
                    </button>
                  </div>
                  {error && (
                    <p className="mt-3 text-sm text-red-400 text-center font-medium">{error}</p>
                  )}
                </div>

              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
