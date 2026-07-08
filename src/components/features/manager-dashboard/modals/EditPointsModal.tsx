"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Transaction } from "../types";

interface EditPointsModalProps {
  tx: Transaction;
  onClose: () => void;
  onSave: (t: Transaction) => void;
  isDarkMode: boolean;
}

export function EditPointsModal({
  tx,
  onClose,
  onSave,
  isDarkMode
}: EditPointsModalProps) {
  const [pts, setPts] = useState(String(Math.abs(tx.pts)));
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      onSave({ ...tx, pts: tx.pts < 0 ? -Number(pts) : Number(pts) });
      onClose();
    }, 800);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm"
    >
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"}`}
      >
        <div className={`px-6 md:px-8 py-5 flex items-center justify-between border-b ${isDarkMode ? "border-slate-700" : "border-slate-50"}`}>
          <h2 className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>Puan Düzelt</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={18}/></button>
        </div>
        <div className="p-6 md:p-8">
          <div className="space-y-4 mb-6">
            <input type="number" value={pts} onChange={e => setPts(e.target.value)} className={`w-full px-4 py-3 rounded-xl border outline-none min-h-[44px] ${isDarkMode ? "bg-[#0a0f1e] border-slate-700 text-white focus:border-cyan-500" : "bg-slate-50 border-slate-200 focus:border-cyan-400"}`} />
            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Sebep..." className={`w-full px-4 py-3 rounded-xl border outline-none h-24 ${isDarkMode ? "bg-[#0a0f1e] border-slate-700 text-white focus:border-cyan-500" : "bg-slate-50 border-slate-200 focus:border-cyan-400"}`} />
          </div>
          <button onClick={handleSave} className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-cyan-600 shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[44px]">{saved ? "Kaydedildi" : "Kaydet"}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
