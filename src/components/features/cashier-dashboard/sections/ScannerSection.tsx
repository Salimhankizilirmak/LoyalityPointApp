"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  QrCode, Star, Gift, CheckCircle, XCircle, ArrowLeft, Plus 
} from "lucide-react";
import { CustomerData, TxType } from "../hooks/useCashierDashboard";

const INDIGO = "#4f46e5";
const LIGHT = "#eef2ff";

const TIER_COLORS: Record<string, { bg: string; color: string }> = {
  Bronze: { bg: "#fef3c7", color: "#b45309" },
  Silver: { bg: "#f1f5f9", color: "#475569" },
  Gold: { bg: "#fef9c3", color: "#a16207" },
  Platinum: { bg: "#ecfeff", color: "#0891b2" },
};

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

interface ScannerSectionProps {
  customer: CustomerData | null;
  scanInput: string;
  setScanInput: (val: string) => void;
  scanning: boolean;
  handleScan: (phone: string) => Promise<void>;
  txType: TxType;
  setTxType: (type: TxType) => void;
  amount: string;
  setAmount: (val: string) => void;
  txSuccess: boolean;
  txError: string;
  ptsPreview: number;
  isPending: boolean;
  handleTx: () => Promise<void>;
  reset: () => void;
  setShowAddCustomer: (show: boolean) => void;
}

export function ScannerSection({
  customer,
  scanInput,
  setScanInput,
  scanning,
  handleScan,
  txType,
  setTxType,
  amount,
  setAmount,
  txSuccess,
  txError,
  ptsPreview,
  isPending,
  handleTx,
  reset,
  setShowAddCustomer
}: ScannerSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Hardware Scanner Focus Guard: Always refocus input on blur, click, or keydown
  useEffect(() => {
    if (!customer) {
      // Focus initially
      const focusInput = () => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        }
      };

      focusInput();

      const handleGlobalClick = () => {
        focusInput();
      };

      const handleGlobalKeyDown = () => {
        const active = document.activeElement;
        if (active?.tagName !== "INPUT" && active?.tagName !== "TEXTAREA") {
          focusInput();
        }
      };

      const handleBlur = () => {
        setTimeout(focusInput, 10);
      };

      const inputEl = inputRef.current;
      inputEl?.addEventListener("blur", handleBlur);
      document.addEventListener("click", handleGlobalClick);
      document.addEventListener("keydown", handleGlobalKeyDown);

      return () => {
        inputEl?.removeEventListener("blur", handleBlur);
        document.removeEventListener("click", handleGlobalClick);
        document.removeEventListener("keydown", handleGlobalKeyDown);
      };
    }
  }, [customer]);

  return (
    <div className="space-y-4">
      {!customer ? (
        <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #f1f5f9" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-800 font-semibold text-[12px]">Müşteri İşlemi</h3>
            <button 
              onClick={() => setShowAddCustomer(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[36px]"
            >
              <Plus size={13} />Yeni Müşteri
            </button>
          </div>
          
          <div className="relative mb-3">
            <QrCode size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              ref={inputRef}
              autoFocus
              value={scanInput} 
              onChange={e => setScanInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleScan(scanInput)}
              placeholder="Müşteri Telefon veya ID..."
              className="w-full pl-9 pr-28 py-3 rounded-xl text-[10px] text-slate-800 font-mono outline-none min-h-[44px]"
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }} 
            />
            <button 
              onClick={() => handleScan(scanInput)} 
              disabled={scanning || !scanInput}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg text-[10px] font-semibold text-white min-h-[36px] flex items-center"
              style={{ background: scanInput ? INDIGO : "#cbd5e1" }}
            >
              {scanning ? "..." : "Sorgula"}
            </button>
          </div>

          {txError && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl mb-3"
              style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
            >
              <XCircle size={14} className="text-red-500" />
              <span className="text-red-600 text-[10px] font-medium">{txError}</span>
            </motion.div>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <button 
                onClick={reset} 
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
                style={{ border: "1px solid #e2e8f0" }}
              >
                <ArrowLeft size={14} className="text-slate-500" />
              </button>
              <p className="text-slate-500 text-[10px]">Müşteri listesine dön</p>
            </div>

            <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #f1f5f9", boxShadow: "0 1px 8px rgba(79,70,229,0.06)" }}>
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-[10px] font-bold"
                  style={{ background: LIGHT, color: INDIGO }}
                >
                  {customer.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-slate-900 font-bold text-[12px]">{customer.name}</h3>
                    <span 
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                      style={TIER_COLORS[customer.tier]}
                    >
                      {customer.tier}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px]">{customer.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold" style={{ color: INDIGO }}>{fmt(customer.pts)}</p>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Mevcut Puan</p>
                </div>
              </div>
            </div>

            {txSuccess ? (
              <motion.div 
                initial={{ scale: 0.92, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="bg-white rounded-2xl p-8 text-center"
                style={{ border: "1px solid #f1f5f9" }}
              >
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={36} className="text-emerald-500" />
                </div>
                <h3 className="text-slate-900 font-bold text-[12px] mb-1">İşlem Başarılı!</h3>
                <p className="text-slate-500 text-[10px]">
                  {txType === "EARN" ? `+${fmt(ptsPreview)} puan eklendi` : `-${fmt(ptsPreview)} puan kullanıldı`}
                </p>
              </motion.div>
            ) : (
              <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #f1f5f9" }}>
                <h3 className="text-slate-800 font-semibold text-[12px] mb-4">Puan İşlemi</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {([["EARN", "Puan Yükle", Star, "#059669", "rgba(5,150,105,0.08)"], ["BURN", "Puan Harca", Gift, "#d97706", "rgba(217,119,6,0.08)"]] as const).map(([type, label, Icon, color, bg]) => (
                    <button 
                      key={type} 
                      onClick={() => setTxType(type)}
                      className="p-4 rounded-2xl text-left transition-all outline-none"
                      style={{
                        border: txType === type ? `2px solid ${color}` : "2px solid #f1f5f9",
                        background: txType === type ? bg : "#f8fafc",
                      }}
                    >
                      <Icon size={20} style={{ color }} className="mb-2" />
                      <p className="text-[10px] font-bold" style={{ color: txType === type ? color : "#64748b" }}>{label}</p>
                    </button>
                  ))}
                </div>
                
                <AnimatePresence mode="wait">
                  {txType && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: "auto" }} 
                      exit={{ opacity: 0, height: 0 }} 
                      className="space-y-3 overflow-hidden"
                    >
                      <div>
                        <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1 block">
                          {txType === "EARN" ? "Alışveriş Tutarı (₺)" : "Harcanacak Puan"}
                        </label>
                        <input 
                          type="number" 
                          value={amount} 
                          onChange={e => setAmount(e.target.value)}
                          placeholder={txType === "EARN" ? "Tutar giriniz..." : `Max: ${customer.pts}`}
                          className="w-full px-4 py-3 rounded-xl text-[10px] font-bold text-slate-800 outline-none min-h-[44px]"
                          style={{ background: "#f8fafc", border: `2px solid ${amount ? "#c7d2fe" : "#e2e8f0"}` }} 
                        />
                      </div>
                      
                      {ptsPreview > 0 && (
                        <div 
                          className="flex items-center justify-between p-3.5 rounded-xl"
                          style={{ 
                            background: txType === "EARN" ? "rgba(5,150,105,0.06)" : "rgba(217,119,6,0.06)", 
                            border: `1px solid ${txType === "EARN" ? "rgba(5,150,105,0.15)" : "rgba(217,119,6,0.15)"}` 
                          }}
                        >
                          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: txType === "EARN" ? "#059669" : "#d97706" }}>
                            {txType === "EARN" ? "Kazanılacak" : "Harcanacak"}
                          </span>
                          <span className="text-[10px] font-bold" style={{ color: txType === "EARN" ? "#059669" : "#d97706" }}>
                            {txType === "EARN" ? "+" : "-"}{fmt(ptsPreview)}
                          </span>
                        </div>
                      )}
                      
                      {txError && (
                        <div 
                          className="flex items-center gap-2 p-3 rounded-xl border text-rose-600 text-[10px] font-semibold"
                          style={{ background: "#fef2f2", borderColor: "#fecaca" }}
                        >
                          <XCircle size={14} className="text-rose-500" />
                          <span>{txError}</span>
                        </div>
                      )}

                      <button 
                        onClick={handleTx} 
                        disabled={!amount || ptsPreview <= 0 || scanning || isPending}
                        className="w-full py-4 rounded-2xl font-bold text-[10px] text-white transition-all shadow-lg min-h-[44px]"
                        style={{ 
                          background: amount && ptsPreview > 0 ? INDIGO : "#cbd5e1", 
                          boxShadow: amount && ptsPreview > 0 ? "0 4px 20px rgba(79,70,229,0.2)" : "none" 
                        }}
                      >
                        {scanning || isPending ? "İşleniyor..." : "İşlemi Tamamla"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
