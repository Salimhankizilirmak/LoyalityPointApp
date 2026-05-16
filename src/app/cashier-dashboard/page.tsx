"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode, Star, CheckCircle, XCircle, User, Gift,
  Zap, ArrowLeft, ScanLine, Wifi, Plus, AlertTriangle, Lock
} from "lucide-react";
import { findCustomerById, processTransactionAction, inviteCustomerAction, getBranchStatus } from "./actions";
import { AddCustomerModal } from "@/components/features/manager-dashboard/AddCustomerModal";

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

const TIER_COLORS: Record<string, { bg: string; color: string }> = {
  Bronze: { bg: "#fef3c7", color: "#b45309" },
  Silver: { bg: "#f1f5f9", color: "#475569" },
  Gold: { bg: "#fef9c3", color: "#a16207" },
  Platinum: { bg: "#ecfeff", color: "#0891b2" },
};

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

export default function CashierDashboardPage() {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [txType, setTxType] = useState<TxType>(null);
  const [amount, setAmount] = useState("");
  const [txSuccess, setTxSuccess] = useState(false);
  const [txError, setTxError] = useState("");
  const [stats, setStats] = useState({ totalTxToday: 0, ptsGivenToday: 0, newMembersToday: 0 });
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [branchStatus, setBranchStatus] = useState<{ isActive: boolean, isDeleted: boolean } | null>(null);

  useEffect(() => {
    const checkStatus = () => {
      getBranchStatus().then(status => {
        if ("isActive" in status) {
          setBranchStatus({ isActive: status.isActive as boolean, isDeleted: status.isDeleted as boolean });
        } else {
          setBranchStatus({ isActive: false, isDeleted: true });
        }
      });
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // 30s check
    return () => clearInterval(interval);
  }, []);

  const baseAmount = Number(amount) || 0;
  const ptsPreview = (!amount || !txType) ? 0 : (txType === "earn" ? Math.floor(baseAmount / 10) * 10 : Math.min(baseAmount, customer?.pts ?? 0));

  const handleScan = async (id: string) => {
    if (!id) return;
    setScanning(true);
    setTxError("");
    try {
      const found = await findCustomerById(id);
      if (found) {
        setCustomer({
          id: found.id,
          name: `${found.firstName} ${found.lastName}`,
          phone: found.phone,
          pts: found.currentPoints,
          tier: "Bronze", // Calculated tier could be added to service
          totalTx: 0, // Transaction count from DB
          avatar: found.firstName[0]
        });
        setScanInput("");
      } else {
        setTxError("Müşteri bulunamadı");
      }
    } catch {
      setTxError("Sorgulama hatası");
    } finally {
      setScanning(false);
    }
  };

  const handleTx = async () => {
    if (!customer || !txType || !amount) return;
    setScanning(true);
    try {
      const result = await processTransactionAction(customer.id, amount, txType);
      if ("error" in result) {
        setTxError(result.error || "İşlem başarısız");
      } else {
        setTxSuccess(true);
        setStats(s => ({ ...s, totalTxToday: s.totalTxToday + 1, ptsGivenToday: s.ptsGivenToday + (txType === "earn" ? ptsPreview : 0) }));
        setTimeout(() => {
          setCustomer(prev => prev ? { ...prev, pts: txType === "earn" ? prev.pts + ptsPreview : prev.pts - ptsPreview } : null);
          setTxSuccess(false); setTxType(null); setAmount("");
        }, 2000);
      }
    } catch {
      setTxError("İşlem sırasında hata oluştu");
    } finally {
      setScanning(false);
    }
  };

  const handleAddCustomer = async (data: { firstName: string, lastName: string, phone: string }) => {
    const formData = new FormData();
    formData.append("firstName", data.firstName);
    formData.append("lastName", data.lastName);
    formData.append("phone", data.phone);
    formData.append("email", `${data.phone}@system.local`); // Default email for system registration

    const res = await inviteCustomerAction(formData);
    if ("error" in res) {
      throw new Error(res.error || "Kayıt hatası");
    }
    setStats(s => ({ ...s, newMembersToday: s.newMembersToday + 1 }));
  };

  const reset = () => { setCustomer(null); setTxType(null); setAmount(""); setTxSuccess(false); setTxError(""); };

  return (
    <div className="min-h-screen w-full" style={{ background: "#f8fafc", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <AnimatePresence>
        {branchStatus?.isDeleted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-6">
              <div className="w-24 h-24 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto border-2 border-rose-500/20">
                <AlertTriangle size={48} className="text-rose-500" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Şubeniz Kapanmıştır</h1>
              <p className="text-slate-400 text-lg leading-relaxed">
                Bu şube artık sistemde aktif değildir. Daha fazla bilgi için lütfen yöneticinizle iletişime geçin.
              </p>
            </div>
          </motion.div>
        )}

        {branchStatus && !branchStatus.isDeleted && !branchStatus.isActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-6">
              <div className="w-24 h-24 rounded-3xl bg-amber-500/10 flex items-center justify-center mx-auto border-2 border-amber-500/20">
                <Lock size={40} className="text-amber-500" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">Şube Geçici Olarak Kapalı</h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Şubeniz şu anda hizmete kapalıdır. İşlemler geçici olarak durdurulmuştur.
              </p>
            </div>
          </motion.div>
        )}

        {showAddCustomer && (
          <AddCustomerModal 
            onClose={() => setShowAddCustomer(false)}
            onAdd={handleAddCustomer}
            isDarkMode={false}
          />
        )}
      </AnimatePresence>

      <div className="bg-white sticky top-0 z-20" style={{ borderBottom: "1px solid #f1f5f9" }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: INDIGO }}>
              <ScanLine size={15} className="text-white" />
            </div>
            <div>
              <p className="text-slate-900 font-bold text-sm leading-tight">Kasa Paneli</p>
              <p className="text-slate-400 text-xs">Aktif Oturum</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: LIGHT, border: "1px solid #c7d2fe" }}>
              <Wifi size={12} style={{ color: INDIGO }} />
              <span className="text-xs font-semibold" style={{ color: INDIGO }}>Canlı</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Bugün İşlem", value: String(stats.totalTxToday), icon: Zap, color: INDIGO },
            { label: "Dağıtılan Puan", value: fmt(stats.ptsGivenToday), icon: Star, color: INDIGO },
            { label: "Yeni Üye", value: String(stats.newMembersToday), icon: User, color: "#059669" },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-4 bg-white text-center" style={{ border: "1px solid #f1f5f9" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${color}12` }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="text-slate-900 font-bold text-lg">{value}</p>
              <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">{label}</p>
            </motion.div>
          ))}
        </div>

        {!customer ? (
          <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #f1f5f9" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-800 font-semibold text-sm">Müşteri İşlemi</h2>
              <button onClick={() => setShowAddCustomer(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <Plus size={13} />Yeni Müşteri
              </button>
            </div>
            
            <div className="relative mb-3">
              <QrCode size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                value={scanInput} onChange={e => setScanInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleScan(scanInput)}
                placeholder="Müşteri Telefon veya ID..."
                className="w-full pl-9 pr-28 py-3 rounded-xl text-sm text-slate-800 font-mono outline-none min-h-[44px]"
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }} />
              <button onClick={() => handleScan(scanInput)} disabled={scanning || !scanInput}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white min-h-[36px] flex items-center"
                style={{ background: scanInput ? INDIGO : "#cbd5e1" }}>
                {scanning ? "..." : "Sorgula"}
              </button>
            </div>

            {txError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl mb-3"
                style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <XCircle size={14} className="text-red-500" />
                <span className="text-red-600 text-xs font-medium">{txError}</span>
              </motion.div>
            )}
          </div>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={reset} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
                  style={{ border: "1px solid #e2e8f0" }}>
                  <ArrowLeft size={14} className="text-slate-500" />
                </button>
                <p className="text-slate-500 text-xs">Müşteri listesine dön</p>
              </div>

              <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #f1f5f9", boxShadow: "0 1px 8px rgba(79,70,229,0.06)" }}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold"
                    style={{ background: LIGHT, color: INDIGO }}>
                    {customer.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-slate-900 font-bold text-base">{customer.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                        style={TIER_COLORS[customer.tier]}>
                        {customer.tier}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{customer.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold" style={{ color: INDIGO }}>{fmt(customer.pts)}</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Mevcut Puan</p>
                  </div>
                </div>
              </div>

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
                  <h3 className="text-slate-800 font-semibold text-sm mb-4">Puan İşlemi</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {([["earn", "Puan Yükle", Star, "#059669", "rgba(5,150,105,0.08)"], ["spend", "Puan Harca", Gift, "#d97706", "rgba(217,119,6,0.08)"]] as const).map(([type, label, Icon, color, bg]) => (
                      <button key={type} onClick={() => setTxType(type)}
                        className="p-4 rounded-2xl text-left transition-all"
                        style={{
                          border: txType === type ? `2px solid ${color}` : "2px solid #f1f5f9",
                          background: txType === type ? bg : "#f8fafc",
                        }}>
                        <Icon size={20} style={{ color }} className="mb-2" />
                        <p className="text-xs font-bold" style={{ color: txType === type ? color : "#64748b" }}>{label}</p>
                      </button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {txType && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                        <div>
                          <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1 block">
                            {txType === "earn" ? "Alışveriş Tutarı (₺)" : "Harcanacak Puan"}
                          </label>
                          <input 
                            type="number" value={amount} onChange={e => setAmount(e.target.value)}
                            placeholder={txType === "earn" ? "Tutar giriniz..." : `Max: ${customer.pts}`}
                            className="w-full px-4 py-3 rounded-xl text-base font-bold text-slate-800 outline-none min-h-[44px]"
                            style={{ background: "#f8fafc", border: `2px solid ${amount ? "#c7d2fe" : "#e2e8f0"}` }} />
                        </div>
                        {ptsPreview > 0 && (
                          <div className="flex items-center justify-between p-3.5 rounded-xl"
                            style={{ background: txType === "earn" ? "rgba(5,150,105,0.06)" : "rgba(217,119,6,0.06)", border: `1px solid ${txType === "earn" ? "rgba(5,150,105,0.15)" : "rgba(217,119,6,0.15)"}` }}>
                            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: txType === "earn" ? "#059669" : "#d97706" }}>
                              {txType === "earn" ? "Kazanılacak" : "Harcanacak"}
                            </span>
                            <span className="text-xl font-bold" style={{ color: txType === "earn" ? "#059669" : "#d97706" }}>
                              {txType === "earn" ? "+" : "-"}{fmt(ptsPreview)}
                            </span>
                          </div>
                        )}
                        <button onClick={handleTx} disabled={!amount || ptsPreview <= 0 || scanning}
                          className="w-full py-4 rounded-2xl font-bold text-sm text-white transition-all shadow-lg min-h-[44px]"
                          style={{ background: amount && ptsPreview > 0 ? INDIGO : "#cbd5e1", boxShadow: amount && ptsPreview > 0 ? "0 4px 20px rgba(79,70,229,0.2)" : "none" }}>
                          {scanning ? "İşleniyor..." : "İşlemi Tamamla"}
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
