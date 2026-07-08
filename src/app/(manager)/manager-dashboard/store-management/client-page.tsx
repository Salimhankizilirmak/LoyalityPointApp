"use client";

import { useState } from "react";
import { Save, CheckCircle, Store, Settings2, Loader2 } from "lucide-react";
import { updateStoreSettingsAction } from "../actions";
import { updateBranchEarnRatioAction } from "../campaign-actions";

interface StoreManagementClientProps {
  initialData: any;
}

export function StoreManagementClient({ initialData }: StoreManagementClientProps) {
  const [pointsEquivalent, setPointsEquivalent] = useState(initialData?.settings?.pointsEquivalent ?? 1);
  const [tlEquivalent, setTlEquivalent] = useState(initialData?.settings?.tlEquivalent ?? 1);
  
  const [parityMode, setParityMode] = useState<"POINTS_PER_TL" | "TL_PER_POINT">(tlEquivalent > pointsEquivalent ? "TL_PER_POINT" : "POINTS_PER_TL");
  const [parityValue, setParityValue] = useState(Math.max(pointsEquivalent, tlEquivalent, 1));

  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [defaultRate, setDefaultRate] = useState(initialData?.earnRatio ?? 10);
  const [localRate, setLocalRate] = useState(initialData?.earnRatio ?? 10);
  const [savingRate, setSavingRate] = useState(false);
  const [rateSaved, setRateSaved] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  const isDarkMode = true; // Sidebar design assumes dark mode context or follows global

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setError(null);
    try {
      const pEq = parityMode === "POINTS_PER_TL" ? parityValue : 1;
      const tEq = parityMode === "TL_PER_POINT" ? parityValue : 1;

      const res = await updateStoreSettingsAction(pEq, tEq);
      if (res && "error" in res) {
        setError(res.error);
      } else {
        setPointsEquivalent(pEq);
        setTlEquivalent(tEq);
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Ayarlar kaydedilirken hata oluştu.");
    } finally {
      setSavingSettings(false);
    }
  };
  const handleSaveRate = async () => {
    setSavingRate(true);
    setRateError(null);
    const res = await updateBranchEarnRatioAction(localRate);
    setSavingRate(false);
    if (res.success) {
      setDefaultRate(localRate);
      setRateSaved(true);
      setTimeout(() => setRateSaved(false), 2500);
    } else {
      setRateError(res.error || "Oran güncellenemedi.");
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-6 w-full transition-all duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">Mağaza Yönetimi</h1>
            <p className="text-slate-400 font-medium text-sm">
              Müşterilerin puan değerlerini (Parite) ayarlayın. Bu ayar tüm organizasyon için geçerlidir.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-3xl p-8 border bg-slate-900/40 backdrop-blur-xl border-slate-700/50 shadow-2xl relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 blur-[50px] -z-10" />
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Store size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">Parite Ayarları</h2>
                <p className="text-slate-400 text-xs">1 Puanın TL karşılığını veya tam tersini ayarlayın.</p>
              </div>
            </div>

            <div className="space-y-6 flex-1 flex flex-col">
              <div className="flex items-start gap-3 p-4 rounded-2xl border bg-blue-500/5 border-blue-500/20">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-blue-400 text-xs font-black">i</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-300">
                    Puan / TL Karşılığı (Parite)
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Bu ayar mağazanızda puan kazanan tüm müşterilerin harcamalarından doğacak olan TL değerini belirler. Geçmiş işlemleri etkilemez.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2 block tracking-[0.1em]">PUAN DEĞERİ (PARİTE)</label>
                <div className="flex flex-col gap-4">
                  <div className="flex p-1 bg-slate-900/60 rounded-xl w-fit border border-slate-700/50">
                    <button
                      onClick={() => setParityMode("POINTS_PER_TL")}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${parityMode === "POINTS_PER_TL" ? "bg-slate-700 shadow-sm text-blue-400" : "text-slate-400 hover:text-slate-300"}`}
                    >
                      1 TL = X Puan
                    </button>
                    <button
                      onClick={() => setParityMode("TL_PER_POINT")}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${parityMode === "TL_PER_POINT" ? "bg-slate-700 shadow-sm text-blue-400" : "text-slate-400 hover:text-slate-300"}`}
                    >
                      1 Puan = X TL
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-300">
                      {parityMode === "POINTS_PER_TL" ? "1 TL =" : "1 Puan ="}
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={parityValue}
                      onChange={(e) => setParityValue(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-3 py-2 rounded-xl text-center font-black outline-none border transition-colors bg-slate-900/60 border-slate-700/50 text-white focus:border-blue-500"
                    />
                    <span className="text-sm font-bold text-slate-300">
                      {parityMode === "POINTS_PER_TL" ? "Puan" : "TL"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Sadece tam sayı girilmelidir.</p>
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className={`w-full py-4 mt-auto rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all ${settingsSaved ? "bg-emerald-600 shadow-lg shadow-emerald-500/20" : "bg-blue-600 shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99]"
                  }`}
              >
                {settingsSaved ? <><CheckCircle size={18} /> Ayarlar Kaydedildi</> : <><Save size={18} /> Ayarları Güncelle</>}
              </button>
            </div>
          </div>

          <div className="rounded-3xl p-8 border bg-slate-900/40 backdrop-blur-xl border-slate-700/50 shadow-2xl overflow-hidden relative flex flex-col h-full">
            {/* Glow Effects */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] -z-10" />

            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 flex items-center justify-center shadow-inner text-cyan-400">
                <Settings2 size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white tracking-tight">Şube Kazanım Oranı</h2>
                <p className="text-slate-400 text-xs">Kampanya yokken uygulanacak standart oran</p>
              </div>
            </div>

            {rateError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium mb-6">
                {rateError}
              </div>
            )}

            <div className="space-y-6 flex-1 flex flex-col">
              <div className="flex items-start gap-3 p-4 rounded-2xl border bg-cyan-500/5 border-cyan-500/20">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-cyan-400 text-xs font-black">i</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-cyan-300">
                    Kazanım Oranı Hakkında
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Bu ayar tüm müşteriler için temel kazanım yüzdesini belirler. Özel kampanyalar bu oranı ezebilir.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 w-full">
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={localRate}
                  onChange={(e) => setLocalRate(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-900/80 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-xs text-neutral-500 mt-2 font-medium">
                  <span>%1</span>
                  <span>%50</span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center shrink-0 w-24 h-24 rounded-full border-4 border-indigo-500/20 bg-neutral-900/50 shadow-[0_0_15px_rgba(99,102,241,0.2)] relative">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="8" className="text-neutral-800" />
                  <circle
                    cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="8"
                    strokeDasharray={`${(localRate / 50) * 289} 289`}
                    className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all duration-300 ease-out"
                  />
                </svg>
                <span className="text-xl font-black text-white relative z-10">%{localRate}</span>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-4 pt-6">
              <p className="text-sm text-neutral-400 bg-white/5 px-4 py-2 rounded-lg border border-white/5 text-center">
                100₺ alışverişte <span className="font-bold text-cyan-400">{Math.floor((10000 * localRate) / 10000)} puan</span> kazandırır
              </p>

              <button
                onClick={handleSaveRate}
                disabled={savingRate || localRate === defaultRate}
                className="w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
              >
                {savingRate ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : rateSaved ? (
                  <><CheckCircle size={18} /> Kaydedildi</>
                ) : (
                  <><Save size={18} /> Oranı Kaydet</>
                )}
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
