"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Building2, Check, MapPin } from "lucide-react";
import { Employee, Branch } from "./types";

interface ReassignBranchModalProps {
  onClose: () => void;
  onUpdate: (memberId: string, branchName: string, orgId: string) => Promise<void>;
  employee: Employee;
  branches: Branch[];
  isDarkMode: boolean;
}

export function ReassignBranchModal({ onClose, onUpdate, employee, branches, isDarkMode }: ReassignBranchModalProps) {
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!selectedBranchId) return;
    const branch = branches.find(b => b.id === selectedBranchId || String(b.id) === selectedBranchId);
    if (!branch) return;

    setLoading(true);
    try {
      await onUpdate(employee.id, branch.name, String(branch.id));
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
            <Building2 size={18} className="text-blue-500" />
            <h2 className={`font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Şube Değiştir</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className={`p-3 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-blue-50/30 border-blue-100"}`}>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Personel</p>
            <div className="flex items-center gap-2">
               <p className={`font-black text-sm ${isDarkMode ? "text-white" : "text-blue-900"}`}>{employee.name}</p>
               <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold">{employee.role}</span>
            </div>
          </div>

          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
              <MapPin size={12} /> Yeni Şube Seçin
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {branches.length > 0 ? (
                branches.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBranchId(String(b.id))}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      selectedBranchId === String(b.id)
                        ? "border-blue-500 bg-blue-500/10 shadow-sm"
                        : (isDarkMode ? "border-slate-700 hover:border-slate-600 bg-slate-900/50" : "border-slate-100 hover:border-blue-200 bg-white")
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                        isDarkMode ? "bg-slate-700 text-blue-400" : "bg-blue-50 text-blue-600"
                      }`}>
                        {b.name[0]}
                      </div>
                      <div className="text-left">
                        <p className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>{b.name}</p>
                        <p className="text-slate-500 text-[9px] font-medium">{b.city}</p>
                      </div>
                    </div>
                    {selectedBranchId === String(b.id) && <Check size={14} className="text-blue-500" />}
                  </button>
                ))
              ) : (
                <div className={`p-4 rounded-2xl border border-dashed text-center ${isDarkMode ? "border-slate-700 bg-slate-900/30" : "border-slate-200 bg-slate-50"}`}>
                  <p className="text-slate-500 text-xs font-medium">Şube bulunamadı.</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleUpdate}
            disabled={loading || !selectedBranchId}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all mt-4"
          >
            {loading ? "Güncelleniyor..." : "Şubeyi Güncelle"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
