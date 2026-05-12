"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode, Star, CheckCircle, XCircle, User, Gift, RotateCcw,
  Zap, ArrowLeft, ScanLine, Wifi
} from "lucide-react";

const INDIGO = "#4f46e5";
const LIGHT = "#eef2ff";

interface CustomerData {
  id: string;
  name: string;
  phone: string;
  pts: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  totalTx: number;
  avatar: string;
}

type TxType = "earn" | "spend" | null;

const MOCK_CUSTOMERS: Record<string, CustomerData> = {
  "KD-001": { id: "KD-001", name: "Fatma Güler", phone: "0532 *** **11", pts: 4820, tier: "Gold", totalTx: 87, avatar: "FG" },
  "KD-002": { id: "KD-002", name: "Mehmet Koç", phone: "0541 *** **72", pts: 1240, tier: "Silver", totalTx: 42, avatar: "MK" },
  "KD-003": { id: "KD-003", name: "Zeynep Aydın", phone: "0555 *** **43", pts: 8320, tier: "Platinum", totalTx: 153, avatar: "ZA" },
};

const TIER_COLORS: Record<string, { bg: string; color: string }> = {
  Bronze: { bg: "#fef3c7", color: "#b45309" },
  Silver: { bg: "#f1f5f9", color: "#475569" },
  Gold: { bg: "#fef9c3", color: "#a16207" },
  Platinum: { bg: "#ecfeff", color: "#0891b2" },
};

const RECENT_IDS = Object.keys(MOCK_CUSTOMERS);
const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

export default function CashierDashboardPage() {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [txType, setTxType] = useState<TxType>(null);
  const [amount, setAmount] = useState("");
  const [txSuccess, setTxSuccess] = useState(false);
  const [txError, setTxError] = useState(false);
  const [totalTxToday, setTotalTxToday] = useState(78);
  const [ptsGivenToday, setPtsGivenToday] = useState(14820);
  const [newMembersToday, setNewMembersToday] = useState(7);
  const [scannerActive, setScannerActive] = useState(false);
  const baseAmount = Number(amount) || 0;
  const ptsPreview = (!amount || !txType) ? 0 : (txType === "earn" ? Math.floor(baseAmount / 10) * 10 : Math.min(baseAmount, customer?.pts ?? 0));

  const handleScan = (id: string) => {
    if (!id) return;
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      const found = MOCK_CUSTOMERS[id.toUpperCase()];
      if (found) { setCustomer(found); setScanInput(""); }
      else { setTxError(true); setTimeout(() => setTxError(false), 2000); setScanInput(""); }
    }, 700);
  };

  const handleTx = () => {
    if (!customer || !txType || !amount) return;
    const pts = ptsPreview;
    setTxSuccess(true);
    setTotalTxToday(t => t + 1);
    if (txType === "earn") setPtsGivenToday(p => p + pts);
    setTimeout(() => {
      setCustomer(prev => prev ? { ...prev, pts: txType === "earn" ? prev.pts + pts : prev.pts - pts, totalTx: prev.totalTx + 1 } : null);
      setTxSuccess(false); setTxType(null); setAmount("");
    }, 2000);
  };

  const reset = () => { setCustomer(null); setTxType(null); setAmount(""); setTxSuccess(false); };

  return (
    <div className="min-h-screen w-full" style={{ background: "#f8fafc", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      {/* Top Bar */}
      <div className="bg-white sticky top-0 z-20" style={{ borderBottom: "1px solid #f1f5f9" }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: INDIGO }}>
              <ScanLine size={15} className="text-white" />
            </div>
            <div>
              <p className="text-slate-900 font-bold text-sm leading-tight">Kasa Paneli</p>
              <p className="text-slate-400 text-xs">Pos #03 · İst. Cevahir</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: LIGHT, border: "1px solid #c7d2fe" }}>
              <Wifi size={12} style={{ color: INDIGO }} />
              <span className="text-xs font-semibold" style={{ color: INDIGO }}>Online</span>
            </div>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-50">
              <span className="text-xs font-bold text-indigo-700">AK</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Bugün İşlem", value: String(totalTxToday), icon: Zap, color: INDIGO },
            { label: "Dağıtılan Puan", value: fmt(ptsGivenToday), icon: Star, color: INDIGO },
            { label: "Yeni Üye", value: String(newMembersToday), icon: User, color: "#059669" },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-4 bg-white text-center" style={{ border: "1px solid #f1f5f9" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${color}12` }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="text-slate-900 font-bold text-lg">{value}</p>
              <p className="text-slate-400 text-xs">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Scanner Panel */}
        {!customer ? (
          <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #f1f5f9" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-800 font-semibold text-sm">Müşteri Okut</h2>
              <button onClick={() => setScannerActive(a => !a)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: scannerActive ? LIGHT : "#f8fafc", color: scannerActive ? INDIGO : "#64748b", border: "1px solid #e2e8f0" }}>
                <QrCode size={13} />{scannerActive ? "Kamera Aktif" : "Kamera Başlat"}
              </button>
            </div>
            <AnimatePresence>
              {scannerActive && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 160, opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="rounded-xl mb-4 overflow-hidden flex items-center justify-center"
                  style={{ background: "#0f172a", border: "2px solid #c7d2fe" }}>
                  <div className="text-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                      <ScanLine size={32} style={{ color: INDIGO }} className="mx-auto mb-2" />
                    </motion.div>
                    <p className="text-slate-400 text-xs">QR kodu kameraya tutun</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="relative mb-3">
              <label htmlFor="qrInput" className="sr-only">Müşteri ID veya QR</label>
              <QrCode size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                id="qrInput"
                value={scanInput} onChange={e => setScanInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleScan(scanInput)}
                placeholder="ID girin veya QR okutun..."
                className="w-full pl-9 pr-28 py-3 rounded-xl text-sm text-slate-800 font-mono outline-none min-h-[44px]"
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }} />
              <button onClick={() => handleScan(scanInput)} disabled={scanning || !scanInput}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white min-h-[44px] flex items-center"
                style={{ background: scanInput ? INDIGO : "#cbd5e1" }}>
                {scanning ? "..." : "Sorgula"}
              </button>
            </div>
            <AnimatePresence>
              {txError && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 p-3 rounded-xl mb-3"
                  style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                  <XCircle size={14} className="text-red-500" />
                  <span className="text-red-600 text-xs font-medium">Müşteri bulunamadı</span>
                </motion.div>
              )}
            </AnimatePresence>
            <div>
              <p className="text-slate-400 text-xs mb-2">Hızlı Seçim (Test)</p>
              <div className="flex flex-wrap gap-2">
                {RECENT_IDS.map(id => (
                  <button key={id} onClick={() => handleScan(id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium font-mono"
                    style={{ background: LIGHT, color: INDIGO, border: "1px solid #c7d2fe" }}>
                    {id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Customer card + TX panel */
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={reset} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
                  style={{ border: "1px solid #e2e8f0" }}>
                  <ArrowLeft size={14} className="text-slate-500" />
                </button>
                <p className="text-slate-500 text-xs">Başka bir müşteri için ← sola bas</p>
              </div>

              {/* Customer Card */}
              <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #f1f5f9", boxShadow: "0 1px 8px rgba(79,70,229,0.06)" }}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold"
                    style={{ background: LIGHT, color: INDIGO }}>
                    {customer.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-slate-900 font-bold text-base">{customer.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={TIER_COLORS[customer.tier]}>
                        {customer.tier}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{customer.phone} · {customer.totalTx} işlem</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold" style={{ color: INDIGO }}>{fmt(customer.pts)}</p>
                    <p className="text-slate-400 text-xs">Mevcut Puan</p>
                  </div>
                </div>
              </div>

              {/* TX Panel */}
              {txSuccess ? (
                <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-8 text-center"
                  style={{ border: "1px solid #f1f5f9" }}>
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={36} className="text-emerald-500" />
                  </div>
                  <h3 className="text-slate-900 font-bold text-lg mb-1">İşlem Başarılı!</h3>
                  <p className="text-slate-500 text-sm">{txType === "earn" ? `+${fmt(ptsPreview)} puan eklendi` : `-${fmt(ptsPreview)} puan kullanıldı`}</p>
                </motion.div>
              ) : (
                <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #f1f5f9" }}>
                  <h3 className="text-slate-800 font-semibold text-sm mb-4">İşlem Yap</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {([["earn", "Puan Kazandır", Star, "#059669", "rgba(5,150,105,0.08)"], ["spend", "Puan Kullandır", Gift, "#d97706", "rgba(217,119,6,0.08)"]] as const).map(([type, label, Icon, color, bg]) => (
                      <button key={type} onClick={() => setTxType(type)}
                        className="p-4 rounded-2xl text-left transition-all"
                        style={{
                          border: txType === type ? `2px solid ${color}` : "2px solid #f1f5f9",
                          background: txType === type ? bg : "#f8fafc",
                        }}>
                        <Icon size={20} style={{ color }} className="mb-2" />
                        <p className="text-xs font-semibold" style={{ color: txType === type ? color : "#64748b" }}>{label}</p>
                      </button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {txType && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
                        <div>
                          <label htmlFor="txAmount" className="text-slate-500 text-xs font-medium mb-1.5 block">
                            {txType === "earn" ? "Alışveriş Tutarı (₺)" : "Kullanılacak Puan"}
                          </label>
                          <input 
                            id="txAmount"
                            type="number" value={amount} onChange={e => setAmount(e.target.value)}
                            placeholder={txType === "earn" ? "Örn: 350" : `Maks: ${customer.pts}`}
                            className="w-full px-3.5 py-3 rounded-xl text-base font-bold text-slate-800 outline-none min-h-[44px]"
                            style={{ background: "#f8fafc", border: `2px solid ${amount ? "#c7d2fe" : "#e2e8f0"}` }} />
                        </div>
                        {ptsPreview > 0 && (
                          <div className="flex items-center justify-between p-3.5 rounded-xl"
                            style={{ background: txType === "earn" ? "rgba(5,150,105,0.06)" : "rgba(217,119,6,0.06)", border: `1px solid ${txType === "earn" ? "rgba(5,150,105,0.15)" : "rgba(217,119,6,0.15)"}` }}>
                            <span className="text-xs font-medium" style={{ color: txType === "earn" ? "#059669" : "#d97706" }}>
                              {txType === "earn" ? "Kazanılacak Puan" : "Kullanılacak Puan"}
                            </span>
                            <span className="text-xl font-bold" style={{ color: txType === "earn" ? "#059669" : "#d97706" }}>
                              {txType === "earn" ? "+" : "-"}{fmt(ptsPreview)}
                            </span>
                          </div>
                        )}
                        <button onClick={handleTx} disabled={!amount || ptsPreview <= 0}
                          className="w-full py-3.5 rounded-xl font-bold text-sm text-white min-h-[44px]"
                          style={{ background: amount && ptsPreview > 0 ? INDIGO : "#cbd5e1", boxShadow: amount && ptsPreview > 0 ? "0 4px 16px rgba(79,70,229,0.3)" : "none" }}>
                          İşlemi Onayla
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
    </div>
  );
}
