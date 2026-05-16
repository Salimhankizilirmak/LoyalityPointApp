"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Transaction } from "./types";

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    >
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl ${isDarkMode ? "bg-slate-800 border border-slate-700" : "bg-white"}`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Puan Düzelt</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18}/></button>
        </div>
        <div className="space-y-4 mb-6">
          <input type="number" value={pts} onChange={e => setPts(e.target.value)} className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`} />
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Sebep..." className={`w-full p-3 rounded-xl border outline-none h-24 ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`} />
        </div>
        <button onClick={handleSave} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold">{saved ? "Kaydedildi" : "Kaydet"}</button>
      </motion.div>
    </motion.div>
  );
}
