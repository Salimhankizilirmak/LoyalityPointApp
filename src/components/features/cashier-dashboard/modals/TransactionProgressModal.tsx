"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Receipt, XCircle, ArrowRight } from "lucide-react";
import { TransactionReceipt } from "../hooks/useCashierDashboard";

interface TransactionProgressModalProps {
  isPending: boolean;
  receipt: TransactionReceipt | null;
  txError: string;
  onClose: () => void;
}

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

export function TransactionProgressModal({
  isPending,
  receipt,
  txError,
  onClose,
}: TransactionProgressModalProps) {
  const isOpen = isPending || receipt !== null || txError !== "";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 backdrop-blur-md pointer-events-auto"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="w-full max-w-sm rounded-3xl border border-indigo-500/20 bg-slate-900 shadow-2xl relative overflow-hidden flex flex-col justify-between"
          >
            {/* Arka Plan Neon Efekti */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

            <div className="p-6 text-center space-y-4">
              {/* 1. YÜKLENİYOR DURUMU */}
              {isPending && !receipt && !txError && (
                <div className="space-y-4 py-6 flex flex-col items-center justify-center">
                  <Loader2 size={36} className="text-cyan-400 animate-spin" />
                  <div className="space-y-1">
                    <h3 className="text-[12px] font-black text-white tracking-tight">
                      İşlem Gerçekleştiriliyor
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Lütfen sistem onayını bekleyiniz...
                    </p>
                  </div>
                </div>
              )}

              {/* 2. HATA DURUMU */}
              {txError && !isPending && (
                <div className="space-y-4 py-4 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                    <XCircle size={24} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-[12px] font-black text-red-400 tracking-tight">
                      İşlem Başarısız Oldu
                    </h3>
                    <p className="text-[10px] text-slate-300 px-4 leading-relaxed">
                      {txError}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-2 px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/5 text-[10px] font-bold text-white transition-all cursor-pointer"
                  >
                    Kapat ve Tekrar Dene
                  </button>
                </div>
              )}

              {/* 3. BAŞARI DURUMU VE FİNANSAL MAKBUZ */}
              {receipt && !isPending && (
                <div className="space-y-4 text-left">
                  {/* Makbuz Başlığı */}
                  <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Receipt size={16} />
                    </div>
                    <div>
                      <h3 className="text-[12px] font-black uppercase text-emerald-400 tracking-wider">
                        İşlem Makbuzu
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {receipt.timestamp} • BAŞARILI
                      </p>
                    </div>
                  </div>

                  {/* Makbuz Gövdesi (POS Fişi Ergonomisi) */}
                  <div className="space-y-3 font-mono text-[10px] bg-slate-950/50 p-4 rounded-2xl border border-white/5 relative">
                    {/* Kesik Kağıt Efekti Süslemesi */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 uppercase font-black">Müşteri</p>
                      <p className="font-bold text-white text-[10px] truncate">{receipt.customerName}</p>
                      <p className="text-[10px] text-slate-400">{receipt.customerPhone}</p>
                    </div>

                    <div className="border-t border-dashed border-white/10 my-2" />

                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 uppercase font-black text-[10px]">İşlem Türü</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        receipt.txType === "EARN"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}>
                        {receipt.txType === "EARN" ? "PUAN KAZANIMI" : "PUAN HARCAMA"}
                      </span>
                    </div>

                    {receipt.refId && (
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 uppercase font-black text-[10px]">Referans No</span>
                        <span className="font-bold text-slate-300 font-mono">#{receipt.refId}</span>
                      </div>
                    )}

                    {receipt.txType === "EARN" ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 uppercase font-black text-[10px]">Alışveriş Tutarı</span>
                          <span className="font-bold text-white">{fmt(Number(receipt.amount))} ₺</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 uppercase font-black text-[10px]">Kazanılan Puan</span>
                          <span className="font-bold text-emerald-400 font-mono">+{fmt(receipt.ptsPreview)} Pts</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 uppercase font-black text-[10px]">Toplam Sepet</span>
                          <span className="font-bold text-white">{fmt(receipt.totalCartAmount ?? 0)} ₺</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 uppercase font-black text-[10px]">Harcanan Puan</span>
                          <span className="font-bold text-amber-400 font-mono">-{fmt(receipt.ptsBurned ?? 0)} Pts</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 uppercase font-black text-[10px]">Nakit/Kart Ödenen</span>
                          <span className="font-bold text-emerald-400">{fmt(receipt.cashPaid ?? 0)} ₺</span>
                        </div>
                      </>
                    )}

                    <div className="border-t border-dashed border-white/10 my-2" />

                    {/* Bakiye Değişimi */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-500 uppercase font-black text-center">Sadakat Puanı Bakiyesi</p>
                      <div className="flex items-center justify-center gap-4 bg-slate-900/80 p-2.5 rounded-xl border border-white/5">
                        <div className="text-center">
                          <p className="text-[10px] text-slate-500 uppercase">Eski</p>
                          <p className="font-bold text-slate-400 font-mono text-[10px]">{fmt(receipt.oldPoints)}</p>
                        </div>
                        <ArrowRight size={14} className="text-slate-500" />
                        <div className="text-center">
                          <p className="text-[10px] text-emerald-500 uppercase font-bold">Yeni</p>
                          <p className="font-black text-emerald-400 font-mono text-[10px]">{fmt(receipt.newPoints)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Kapat Butonu */}
                  <button
                    onClick={onClose}
                    className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase text-white shadow-lg transition-all cursor-pointer text-center bg-gradient-to-r ${
                      receipt.txType === "EARN"
                        ? "from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400"
                        : "from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400"
                    }`}
                  >
                    Makbuzu Yazdır & Kapat
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
