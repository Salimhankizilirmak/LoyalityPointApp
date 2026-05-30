"use client";

import { motion } from "framer-motion";
import { Gift, Info } from "lucide-react";

interface OffersSectionProps {
  state: {
    pts: number;
  };
}

const BRAND = "#0891b2";
const BRAND_LIGHT = "#ecfeff";
const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

const OFFERS = [
  { id: 1, title: "%20 Sonbahar İndirimi", pts: 1500, expires: "30 Haz 2025", category: "Giyim" },
  { id: 2, title: "Ücretsiz Kargo", pts: 800, expires: "31 Tem 2025", category: "E-ticaret" },
  { id: 3, title: "Kahve Kuponu", pts: 400, expires: "15 Haz 2025", category: "Yiyecek" },
];

export function OffersSection({ state }: OffersSectionProps) {
  const { pts } = state;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-slate-800 font-semibold text-sm">Mevcut Teklifler</h2>
      </div>

      <div className="space-y-3">
        {OFFERS.map((offer, i) => (
          <motion.div 
            key={offer.id} 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }}
            className="rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-sm"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2 inline-block"
                    style={{ background: BRAND_LIGHT, color: BRAND }}>
                    {offer.category}
                  </span>
                  <h3 className="text-slate-800 font-bold text-xs leading-snug">{offer.title}</h3>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-black" style={{ color: BRAND }}>{fmt(offer.pts)}</p>
                  <p className="text-slate-400 text-[10px]">puan</p>
                </div>
              </div>
              <p className="text-slate-400 text-[10px] mb-3">Geçerlilik: {offer.expires}</p>
              <button 
                disabled={pts < offer.pts}
                className="w-full py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 min-h-[44px] transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: pts >= offer.pts ? BRAND : "#f1f5f9",
                  color: pts >= offer.pts ? "#fff" : "#94a3b8",
                }}
              >
                {pts >= offer.pts ? (
                  <>
                    <Gift size={13} />
                    <span>Kuponu Kullan</span>
                  </>
                ) : (
                  <>
                    <Info size={13} />
                    <span>Yeterli Puanınız Yok</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
