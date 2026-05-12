"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, CheckCircle, Shield, Settings, User, Edit3, X, Check } from "lucide-react";

interface BossProfileSettingsProps {
  pointRate: number;
  validityMonths: number;
  bossName: string;
  orgName: string;
  isDarkMode: boolean;
  onSaveSettings: (rate: number, validity: number) => Promise<void>;
  onUpdateName: (firstName: string, lastName: string) => Promise<void>;
  savingSettings: boolean;
  settingsSaved: boolean;
}

export function BossProfileSettings({
  pointRate,
  validityMonths,
  bossName,
  orgName,
  isDarkMode,
  onSaveSettings,
  onUpdateName,
  savingSettings,
  settingsSaved
}: BossProfileSettingsProps) {
  const [localRate, setLocalRate] = useState(pointRate);
  const [localValidity, setLocalValidity] = useState(validityMonths);

  // Name Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const initialNames = bossName.split(" ");
  const [firstName, setFirstName] = useState(initialNames[0] || "");
  const [lastName, setLastName] = useState(initialNames.slice(1).join(" ") || "");
  const [isSavingName, setIsSavingName] = useState(false);

  const handleSaveName = async () => {
    setIsSavingName(true);
    try {
      await onUpdateName(firstName, lastName);
      setIsEditingName(false);
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {/* Organization Settings */}
      <div className={`rounded-3xl p-8 border transition-all ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100 shadow-sm"
        }`}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Settings size={20} />
          </div>
          <div>
            <h2 className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-slate-900"}`}>Organizasyon Ayarları</h2>
            <p className="text-slate-500 text-xs">Puan kazanım oranlarını ve geçerlilik sürelerini belirleyin.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2 block">Puan Kazanım Oranı (%)</label>
            <div className="flex items-center gap-4">
              <input
                type="range" min="1" max="50" value={localRate} onChange={e => setLocalRate(Number(e.target.value))}
                className={`flex-1 accent-blue-600 h-1.5 rounded-lg cursor-pointer ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`}
              />
              <span className={`w-12 text-center font-black text-sm ${isDarkMode ? "text-white" : "text-slate-800"}`}>%{localRate}</span>
            </div>
          </div>

          <div>
            <label className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2 block tracking-[0.1em]">PUAN GEÇERLİLİK SÜRESİ (AY)</label>
            <div className="flex items-center gap-4">
              <input
                type="range" min="0" max="24" step="6" value={localValidity} onChange={e => setLocalValidity(Number(e.target.value))}
                className={`flex-1 accent-blue-600 h-1.5 rounded-lg cursor-pointer transition-colors ${isDarkMode ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-200 hover:bg-slate-300"
                  }`}
              />
              <span className={`w-16 text-center font-black text-sm ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                {localValidity === 0 ? "Süresiz" : `${localValidity} Ay`}
              </span>
            </div>
          </div>

          <button
            onClick={() => onSaveSettings(localRate, localValidity)}
            disabled={savingSettings}
            className={`w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all ${settingsSaved ? "bg-emerald-600 shadow-lg shadow-emerald-500/20" : "bg-blue-600 shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99]"
              }`}
          >
            {settingsSaved ? <><CheckCircle size={18} /> Ayarlar Kaydedildi</> : <><Save size={18} /> Ayarları Güncelle</>}
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className={`rounded-3xl p-8 border transition-all ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100 shadow-sm"
        }`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <User size={20} />
            </div>
            <div>
              <h2 className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-slate-900"}`}>Profil Bilgileri</h2>
              <p className="text-slate-500 text-xs">Hesap yöneticisi detayları.</p>
            </div>
          </div>
          {!isEditingName && (
            <button
              onClick={() => setIsEditingName(true)}
              className={`p-2 rounded-xl transition-all ${isDarkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
            >
              <Edit3 size={18} />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-100"
            }`}>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Ad Soyad</p>
            {isEditingName ? (
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id="editFirstName"
                    value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="Ad"
                    className={`px-3 py-2 rounded-xl text-xs border outline-none min-h-[44px] ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200 text-black"
                      }`}
                  />
                  <input
                    id="editLastName"
                    value={lastName} onChange={e => setLastName(e.target.value)}
                    placeholder="Soyad"
                    className={`px-3 py-2 rounded-xl text-xs border outline-none min-h-[44px] ${isDarkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-slate-200 text-black"
                      }`}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-500 min-h-[44px]"
                  >
                    <X size={14} />
                  </button>
                  <button
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    className="p-1.5 rounded-lg bg-blue-600 text-white"
                  >
                    {isSavingName ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={14} />}
                  </button>
                </div>
              </div>
            ) : (
              <p className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-800"}`}>{bossName}</p>
            )}
          </div>
          <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Organizasyon</p>
            <p className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-800"}`}>{orgName}</p>
          </div>
          <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Hesap Türü</p>
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-blue-500" />
              <p className="font-black text-xs text-blue-500 uppercase tracking-widest">Süper Yetkili (Patron)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
