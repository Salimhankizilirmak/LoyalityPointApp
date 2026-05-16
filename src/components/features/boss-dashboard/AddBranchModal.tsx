"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Store, MapPin, Plus, ChevronDown } from "lucide-react";
import ILLER from "@/constants/iller.json";

interface AddBranchModalProps {
  onClose: () => void;
  onAdd: (data: { name: string; city: string }) => Promise<void>;
  isDarkMode: boolean;
}

export function AddBranchModal({ onClose, onAdd, isDarkMode }: AddBranchModalProps) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !city) return;
    setLoading(true);
    try {
      await onAdd({ name, city });
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
        className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border ${
          isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"
        }`}
      >
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isDarkMode ? "border-slate-700" : "border-slate-50"
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Plus size={18} />
            </div>
            <h2 className={`font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Yeni Şube Ekle</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Şube Adı</label>
            <div className="relative">
              <Store size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Örn: Kadıköy Şubesi"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl text-sm border outline-none transition-all ${
                  isDarkMode ? "bg-[#0a0f1e] border-slate-700 text-white focus:border-blue-500" : "bg-slate-50 border-slate-200 focus:border-blue-400"
                }`}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Şehir</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
              <select
                required
                value={city}
                onChange={e => setCity(e.target.value)}
                className={`w-full pl-10 pr-10 py-3 rounded-2xl text-sm border outline-none appearance-none transition-all relative ${
                  isDarkMode ? "bg-[#0a0f1e] border-slate-700 text-white focus:border-blue-500" : "bg-slate-50 border-slate-200 focus:border-blue-400"
                }`}
              >
                <option value="">Şehir Seçin...</option>
                {Object.entries(ILLER).map(([id, name]) => (
                  <option key={id} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>



          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all mt-4 ${
              isDarkMode ? "bg-blue-600" : "bg-blue-700"
            }`}
          >
            {loading ? "Ekleniyor..." : "Şubeyi Oluştur"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
