"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, X } from "lucide-react";

interface GlobalToastProps {
  message: {
    text: string;
    type: "success" | "error";
  } | null;
  onClose: () => void;
}

export function GlobalToast({ message, onClose }: GlobalToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <div className="fixed top-20 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`pointer-events-auto max-w-md w-full rounded-2xl p-4 border shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 relative overflow-hidden transition-all ${
              message.type === "success"
                ? "bg-slate-950/90 border-emerald-500/35 shadow-[0_0_30px_rgba(16,185,129,0.15)] text-slate-100"
                : "bg-slate-950/90 border-red-500/35 shadow-[0_0_30px_rgba(239,68,68,0.15)] text-slate-100"
            }`}
          >
            {/* Arka plan glow efektleri (Mor Yasaklı!) */}
            <div className={`absolute -top-12 -left-12 w-24 h-24 rounded-full blur-2xl pointer-events-none ${
              message.type === "success" ? "bg-emerald-500/10" : "bg-red-500/10"
            }`} />

            <div className="flex items-center gap-3 relative z-10">
              <div className="flex-shrink-0">
                {message.type === "success" ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-tight">{message.text}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center border border-white/5 hover:border-white/10 hover:bg-white/5 text-slate-400 transition-all cursor-pointer relative z-10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
