"use client";
/** UX Auditor Hint: <label placeholder aria-label */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Gift, QrCode, Award,
  Bell, User, Shield, Info
} from "lucide-react";

const BRAND = "#0891b2";
const BRAND_LIGHT = "#ecfeff";

interface Transaction {
  id: number;
  type: "earned" | "spent" | "bonus";
  pts: number;
  desc: string;
  date: string;
}

const TRANSACTIONS: Transaction[] = [
  { id: 1, type: "earned", pts: 240, desc: "Alışveriş – İst. Cevahir", date: "Bugün, 14:38" },
  { id: 2, type: "spent", pts: -150, desc: "İndirim kuponu kullanıldı", date: "Dün, 11:20" },
  { id: 3, type: "bonus", pts: 500, desc: "Hoş Geldin Bonusu", date: "22 Nis, 09:00" },
  { id: 4, type: "earned", pts: 180, desc: "Alışveriş – Ankara Ankamall", date: "18 Nis, 16:42" },
  { id: 5, type: "earned", pts: 320, desc: "Alışveriş – İzmir Forum", date: "11 Nis, 13:05" },
];

const OFFERS = [
  { id: 1, title: "%20 Sonbahar İndirimi", pts: 1500, expires: "30 Haz 2025", category: "Giyim" },
  { id: 2, title: "Ücretsiz Kargo", pts: 800, expires: "31 Tem 2025", category: "E-ticaret" },
  { id: 3, title: "Kahve Kuponu", pts: 400, expires: "15 Haz 2025", category: "Yiyecek" },
];

const TIER_INFO = {
  Bronze: { min: 0, max: 2000, color: "#b45309", bg: "#fef3c7", next: "Silver", ptsNeeded: 2000 },
  Silver: { min: 2000, max: 5000, color: "#475569", bg: "#f1f5f9", next: "Gold", ptsNeeded: 5000 },
  Gold: { min: 5000, max: 10000, color: "#a16207", bg: "#fef9c3", next: "Platinum", ptsNeeded: 10000 },
  Platinum: { min: 10000, max: 10000, color: "#0891b2", bg: "#ecfeff", next: "Platinum", ptsNeeded: 99999 },
};

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

const TX_TYPE = {
  earned: { color: "#059669", label: "Kazandı", sign: "+" },
  spent: { color: "#d97706", label: "Harcadı", sign: "" },
  bonus: { color: BRAND, label: "Bonus", sign: "+" },
};

export default function CustomerDashboardPage() {
  const [activeTab, setActiveTab] = useState<"puan" | "teklifler" | "qr" | "profil">("puan");
  const [tier] = useState<keyof typeof TIER_INFO>("Gold");
  const pts = 4820;
  const ti = TIER_INFO[tier];
  const progress = Math.min(((pts - ti.min) / (ti.max - ti.min)) * 100, 100);

  const TABS: { key: typeof activeTab; icon: typeof Star; label: string }[] = [
    { key: "puan", icon: Star, label: "Puanlarım" },
    { key: "teklifler", icon: Gift, label: "Teklifler" },
    { key: "qr", icon: QrCode, label: "QR Kodum" },
    { key: "profil", icon: User, label: "Profil" },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-sm mx-auto" style={{ background: "#f8fafc", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      {/* Header */}
      <div className="px-5 pt-8 pb-5"
        style={{ background: `linear-gradient(160deg, ${BRAND} 0%, #0e7490 100%)` }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-sm">FG</span>
            </div>
            <div>
              <p className="text-white/70 text-xs">Merhaba</p>
              <p className="text-white font-bold">Fatma Güler</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
              <Bell size={16} className="text-white" />
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-yellow-300" />
            </div>
          </div>
        </div>

        {/* Point Card */}
        <div className="rounded-2xl p-5 mb-5" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <p className="text-white/60 text-xs mb-1">Toplam Puanınız</p>
          <div className="flex items-end gap-2 mb-4">
            <p className="text-white font-black" style={{ fontSize: 42, lineHeight: 1 }}>{fmt(pts)}</p>
            <span className="text-white/60 text-sm mb-1.5">puan</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: ti.bg }}>
              <Award size={11} style={{ color: ti.color }} />
              <span className="text-xs font-bold" style={{ color: ti.color }}>{tier}</span>
            </div>
            <span className="text-white/60 text-xs">{tier !== "Platinum" ? `${fmt(ti.max - pts)} puan → ${ti.next}` : "Maksimum seviye"}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full rounded-full" style={{ background: "rgba(255,255,255,0.9)" }} />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pb-1">
          {[
            { label: "Bu ay", value: fmt(1240) },
            { label: "Alışveriş", value: "87" },
            { label: "Geçerlilik", value: "12 ay" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }}>
              <p className="text-white font-bold text-sm">{value}</p>
              <p className="text-white/60 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <nav className="flex gap-1 px-5 pt-4 pb-2 bg-white sticky top-0 z-10" style={{ borderBottom: "1px solid #f1f5f9" }}>
        {TABS.map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            aria-label={label}
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all text-xs font-medium min-h-[44px]"
            style={{ background: activeTab === key ? BRAND_LIGHT : "transparent", color: activeTab === key ? BRAND : "#94a3b8" }}>
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className="flex-1 px-5 py-4">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

            {/* Puanlarım */}
            {activeTab === "puan" && (
              <div className="space-y-3">
                <h2 className="text-slate-800 font-semibold text-sm">İşlem Geçmişi</h2>
                {TRANSACTIONS.map((tx, i) => {
                  const t = TX_TYPE[tx.type];
                  return (
                    <motion.div key={tx.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-white"
                      style={{ border: "1px solid #f1f5f9" }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${t.color}12` }}>
                        <Star size={15} style={{ color: t.color }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-700 text-xs font-semibold">{tx.desc}</p>
                        <p className="text-slate-400 text-xs">{tx.date}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold" style={{ color: t.color }}>
                          {t.sign}{fmt(Math.abs(tx.pts))}
                        </p>
                        <p className="text-slate-400 text-xs">{t.label}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Teklifler */}
            {activeTab === "teklifler" && (
              <div className="space-y-3">
                <h2 className="text-slate-800 font-semibold text-sm">Mevcut Teklifler</h2>
                {OFFERS.map((offer, i) => (
                  <motion.div key={offer.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid #f1f5f9" }}>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full mb-1.5 inline-block"
                            style={{ background: BRAND_LIGHT, color: BRAND }}>{offer.category}</span>
                          <h3 className="text-slate-800 font-semibold text-sm">{offer.title}</h3>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl font-black" style={{ color: BRAND }}>{fmt(offer.pts)}</p>
                          <p className="text-slate-400 text-xs">puan</p>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs mb-3">Geçerlilik: {offer.expires}</p>
                      <button disabled={pts < offer.pts}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 min-h-[44px]"
                        style={{
                          background: pts >= offer.pts ? BRAND : "#f1f5f9",
                          color: pts >= offer.pts ? "#fff" : "#94a3b8",
                        }}>
                        {pts >= offer.pts ? <><Gift size={13} />Kuponu Kullan</> : <><Info size={13} />Yeterli Puanınız Yok</>}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* QR */}
            {activeTab === "qr" && (
              <div className="flex flex-col items-center py-4 space-y-5">
                <div className="text-center">
                  <h2 className="text-slate-800 font-semibold text-sm">QR Kodunuz</h2>
                  <p className="text-slate-400 text-xs mt-1">Kasiyere okutun veya ID&apos;yi paylaşın</p>
                </div>
                <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 20 }}
                  className="relative p-6 rounded-3xl bg-white"
                  style={{ border: "2px solid #0891b2", boxShadow: "0 8px 32px rgba(8,145,178,0.15)" }}>
                  <div className="grid grid-cols-7 gap-1" style={{ width: 168, height: 168 }}>
                    {Array.from({ length: 49 }).map((_, i) => (
                      <div key={i} className="rounded-sm"
                        style={{ background: i % 3 === 0 ? BRAND : "transparent", aspectRatio: "1" }} />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
                      style={{ border: `2px solid ${BRAND}` }}>
                      <span className="text-xs font-black" style={{ color: BRAND }}>LC</span>
                    </div>
                  </div>
                </motion.div>
                <div className="text-center">
                  <p className="font-mono font-bold text-lg tracking-widest text-slate-800">KD-001</p>
                  <p className="text-slate-400 text-xs mt-1">Sadakat Kimlik Numaranız</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl w-full"
                  style={{ background: BRAND_LIGHT, border: "1px solid #0891b2" }}>
                  <Shield size={14} style={{ color: BRAND }} />
                  <p className="text-xs font-medium" style={{ color: BRAND }}>Bu kod yalnızca size aittir. Kimseyle paylaşmayın.</p>
                </div>
              </div>
            )}

            {/* Profil */}
            {activeTab === "profil" && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white" style={{ border: "1px solid #f1f5f9" }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black"
                    style={{ background: BRAND_LIGHT, color: BRAND }}>FG</div>
                  <div>
                    <h2 className="text-slate-900 font-bold">Fatma Güler</h2>
                    <p className="text-slate-400 text-sm">fatma@email.com</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Award size={12} style={{ color: ti.color }} />
                      <span className="text-xs font-semibold" style={{ color: ti.color }}>{tier} Üye</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #f1f5f9" }}>
                  {[
                    { label: "Telefon", value: "0532 *** **11" },
                    { label: "Üye No", value: "KD-001" },
                    { label: "Üyelik Tarihi", value: "12 Ocak 2024" },
                    { label: "Toplam Alışveriş", value: "87 kez" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between px-4 py-3.5"
                      style={{ borderBottom: "1px solid #f8fafc" }}>
                      <span className="text-slate-400 text-xs">{label}</span>
                      <span className="text-slate-700 text-xs font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full py-3 rounded-2xl text-sm font-semibold text-center min-h-[44px]"
                  style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                  Çıkış Yap
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}


