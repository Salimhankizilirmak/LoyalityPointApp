"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, UserCog, Check, Users, ShieldCheck } from "lucide-react";
import { Employee, Branch } from "./types";

interface ChangeManagerModalProps {
  onClose: () => void;
  onUpdate: (branchId: number, managerId: string) => Promise<void>;
  managers: Employee[];
  branch: Branch;
  isDarkMode: boolean;
}

export function ChangeManagerModal({ onClose, onUpdate, managers, branch, isDarkMode }: ChangeManagerModalProps) {
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      await onUpdate(branch.id, selectedId);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border ${
          isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
        }`}
      >
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isDarkMode ? "border-slate-700" : "border-slate-50"
        }`}>
          <div className="flex items-center gap-2">
            <UserCog size={18} className="text-blue-500" />
            <h2 className={`font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Yönetici Ata</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className={`p-3 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-blue-50/30 border-blue-100"}`}>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Şube</p>
            <p className={`font-black text-sm ${isDarkMode ? "text-white" : "text-blue-900"}`}>{branch.name}</p>
          </div>

          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
              <Users size={12} /> Aktif Yöneticiler
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {managers.length > 0 ? (
                managers.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      selectedId === m.id
                        ? "border-blue-500 bg-blue-500/10 shadow-sm"
                        : (isDarkMode ? "border-slate-700 hover:border-slate-600 bg-slate-900/50" : "border-slate-100 hover:border-blue-200 bg-white")
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                        isDarkMode ? "bg-slate-700 text-blue-400" : "bg-blue-50 text-blue-600"
                      }`}>
                        {m.name[0]}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>{m.name}</p>
                          <ShieldCheck size={10} className="text-blue-500" />
                        </div>
                        <p className="text-slate-500 text-[9px] font-medium">{m.email}</p>
                      </div>
                    </div>
                    {selectedId === m.id && <Check size={14} className="text-blue-500" />}
                  </button>
                ))
              ) : (
                <div className={`p-4 rounded-2xl border border-dashed text-center ${isDarkMode ? "border-slate-700 bg-slate-900/30" : "border-slate-200 bg-slate-50"}`}>
                  <p className="text-slate-500 text-xs font-medium">Henüz kayıtlı yönetici bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleUpdate}
            disabled={loading || !selectedId}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all mt-4"
          >
            {loading ? "Güncelleniyor..." : "Yöneticiyi Şubeye Ata"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
