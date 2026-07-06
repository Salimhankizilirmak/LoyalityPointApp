"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface InviteProgressModalProps {
  submitting: boolean;
  toastMessage: { text: string; type: "success" | "error" } | null;
}

export function InviteProgressModal({ submitting, toastMessage }: InviteProgressModalProps) {
  const isOpen = submitting || toastMessage !== null;

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
            className="w-full max-w-sm p-6 rounded-3xl border border-indigo-500/20 bg-slate-900 shadow-2xl relative overflow-hidden text-center space-y-4"
          >
            {/* Neon Arka Plan Dekoru */}
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
            
            {submitting ? (
              <div className="space-y-4 py-4 flex flex-col items-center justify-center">
                <Loader2 size={32} className="text-cyan-400 animate-spin" />
                <div className="space-y-1">
                  <h3 className="text-[12px] font-black text-white tracking-tight">
                    Davet Gönderiliyor
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Lütfen işlem tamamlanana kadar bekleyiniz...
                  </p>
                </div>
              </div>
            ) : toastMessage ? (
              <div className="space-y-4 py-2 flex flex-col items-center justify-center">
                {toastMessage.type === "success" ? (
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                    <CheckCircle2 size={24} />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                    <XCircle size={24} />
                  </div>
                )}
                <div className="space-y-1">
                  <h3 className={`text-[12px] font-black tracking-tight ${toastMessage.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                    {toastMessage.type === "success" ? "Davet Başarılı" : "Hata Oluştu"}
                  </h3>
                  <p className="text-[10px] text-slate-300 px-4 leading-relaxed">
                    {toastMessage.text}
                  </p>
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
