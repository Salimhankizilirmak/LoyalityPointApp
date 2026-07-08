import re

file_path = "src/components/features/manager-dashboard/sections/CampaignSection.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Aktif Kampanyanın sağ üst köşesine butonu koyma
old_card_start = """          {activeCampaign ? (
            <div className={`${cardBase} ${glowHover} border-emerald-500/30 bg-emerald-950/20 overflow-hidden`}>
              <div className="absolute inset-0 bg-emerald-500/5 blur-[60px] -z-10" />

              <div className="flex flex-col gap-6">"""

new_card_start = """          {activeCampaign ? (
            <div className={`${cardBase} ${glowHover} border-emerald-500/30 bg-emerald-950/20 overflow-hidden relative`}>
              <div className="absolute inset-0 bg-emerald-500/5 blur-[60px] -z-10" />
              
              {/* Ana Düzenle Butonu (Sağ Üst Köşe) */}
              <button
                onClick={() => setEditingCampaign({ id: activeCampaign.id, name: activeCampaign.name, startDate: activeCampaign.startDate ? new Date(activeCampaign.startDate).toISOString().split('T')[0] : '', endDate: activeCampaign.endDate ? new Date(activeCampaign.endDate).toISOString().split('T')[0] : '', campaignType: activeCampaign.campaignType, earnRatio: activeCampaign.earnRatio, tiers: Array.isArray(activeCampaign.tiers) ? activeCampaign.tiers : (typeof activeCampaign.tiers === 'string' ? JSON.parse(activeCampaign.tiers) : [{limit: 1000, points: 10}]), description: activeCampaign.description || '' })}
                className="absolute top-4 right-4 z-10 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-white transition-all border border-emerald-500/20 flex items-center gap-2 text-xs font-bold shadow-sm"
                title="Kampanyayı Düzenle"
              >
                <Edit3 size={14} /> Düzenle
              </button>

              <div className="flex flex-col gap-6">"""

content = content.replace(old_card_start, new_card_start)


# 2. Tarih yanındaki Edit butonunu silme
old_date_edit = """                        <span className="text-neutral-300">{formatDate(activeCampaign.startDate)} – {formatDate(activeCampaign.endDate)}</span>
                        <button
                          onClick={() => setEditingCampaign({ id: activeCampaign.id, name: activeCampaign.name, startDate: activeCampaign.startDate ? new Date(activeCampaign.startDate).toISOString().split('T')[0] : '', endDate: activeCampaign.endDate ? new Date(activeCampaign.endDate).toISOString().split('T')[0] : '', campaignType: activeCampaign.campaignType, earnRatio: activeCampaign.earnRatio, tiers: Array.isArray(activeCampaign.tiers) ? activeCampaign.tiers : (typeof activeCampaign.tiers === 'string' ? JSON.parse(activeCampaign.tiers) : [{limit: 1000, points: 10}]), description: activeCampaign.description || '' })}
                          className="ml-2 p-1 rounded-md text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          title="Düzenle"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>"""
new_date_edit = """                        <span className="text-neutral-300">{formatDate(activeCampaign.startDate)} – {formatDate(activeCampaign.endDate)}</span>
                      </div>"""

content = content.replace(old_date_edit, new_date_edit)


# 3. Kademeler içindeki gereksiz edit butonunu silme ve tasarımı biraz daha sadeleştirme
old_details = """<div className="flex flex-col sm:flex-row items-stretch justify-between mt-4 gap-4">
                  <div className="relative bg-neutral-900/60 px-6 py-5 rounded-2xl border border-emerald-500/20 shadow-inner flex-1 w-full">
                    <button
                      onClick={() => setEditingCampaign({ id: activeCampaign.id, name: activeCampaign.name, startDate: activeCampaign.startDate ? new Date(activeCampaign.startDate).toISOString().split('T')[0] : '', endDate: activeCampaign.endDate ? new Date(activeCampaign.endDate).toISOString().split('T')[0] : '', campaignType: activeCampaign.campaignType, earnRatio: activeCampaign.earnRatio, tiers: Array.isArray(activeCampaign.tiers) ? activeCampaign.tiers : (typeof activeCampaign.tiers === 'string' ? JSON.parse(activeCampaign.tiers) : [{limit: 1000, points: 10}]), description: activeCampaign.description || '' })}
                      className="absolute top-3 right-3 p-1.5 rounded-lg text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-500/20 transition-all"
                      title="Oranları/Limitleri Düzenle"
                    >
                      <Edit3 size={16} />
                    </button>

                    {activeCampaign.campaignType === "tiered" ? (
                      <div className="flex flex-col gap-3 w-full">
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">Kademeli Kazançlar</span>
                        <div className="flex flex-col gap-2 w-full">
                          {(Array.isArray(activeCampaign.tiers) ? activeCampaign.tiers : (typeof activeCampaign.tiers === 'string' ? JSON.parse(activeCampaign.tiers) : [])).map((t: any, i: number) => (
                            <div key={i} className="flex justify-between items-center bg-emerald-500/5 border border-emerald-500/10 px-4 py-2.5 rounded-xl">
                              <span className="text-sm text-neutral-300"><span className="font-bold text-white">{t.limit} ₺</span> ve üzeri alışverişe</span>
                              <span className="text-base font-black text-emerald-400">+{t.points} Puan</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4">
                        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-teal-400 tabular-nums">%{activeCampaign.earnRatio}</span>
                        <p className="text-xs text-emerald-400 font-bold uppercase mt-3 tracking-widest">Kazanım Oranı</p>
                      </div>
                    )}
                  </div>"""

new_details = """<div className="flex flex-col sm:flex-row items-stretch justify-between mt-4 gap-4">
                  <div className="bg-emerald-950/30 px-6 py-5 rounded-2xl border border-emerald-500/10 shadow-inner flex-1 w-full">
                    {activeCampaign.campaignType === "tiered" ? (
                      <div className="flex flex-col gap-3 w-full">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80 mb-1">Harcama Limitleri ve Kazançlar</span>
                        <div className="flex flex-col gap-1.5 w-full">
                          {(Array.isArray(activeCampaign.tiers) ? activeCampaign.tiers : (typeof activeCampaign.tiers === 'string' ? JSON.parse(activeCampaign.tiers) : [])).map((t: any, i: number) => (
                            <div key={i} className="flex justify-between items-center px-2 py-1.5">
                              <span className="text-sm text-emerald-100/70"><span className="font-bold text-emerald-100">{t.limit} ₺</span> ve üzeri</span>
                              <span className="text-sm font-black text-emerald-400">+{t.points} Puan</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
                        <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-teal-400 tabular-nums">%{activeCampaign.earnRatio}</span>
                        <p className="text-[10px] text-emerald-400/80 font-bold uppercase mt-2 tracking-widest">Kazanım Oranı</p>
                      </div>
                    )}
                  </div>"""

content = content.replace(old_details, new_details)


# 4. Gelecek kampanyalardaki küçük edit butonunu da sağ üst köşeye alıp güzelleştirelim
old_upcoming = """                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-neutral-400 truncate">{formatDate(c.startDate)} – {formatDate(c.endDate)}</p>
                          <button
                            onClick={() => setEditingCampaign({ id: c.id, name: c.name, startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '', endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '', campaignType: c.campaignType, earnRatio: c.earnRatio, tiers: Array.isArray(c.tiers) ? c.tiers : (typeof c.tiers === 'string' ? JSON.parse(c.tiers) : [{limit: 1000, points: 10}]), description: c.description || '' })}
                            className="p-1 rounded-md text-amber-500 hover:bg-amber-500/20 transition-colors shrink-0"
                            title="Düzenle"
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>"""

new_upcoming = """                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-neutral-400 truncate">{formatDate(c.startDate)} – {formatDate(c.endDate)}</p>
                        </div>"""

content = content.replace(old_upcoming, new_upcoming)

# Butonu flex-col kısmına (en sağa) koyacağız
old_upcoming_right = """                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`font-black text-amber-300 ${c.campaignType === "tiered" ? "text-sm" : "text-lg"}`}>
                          {c.campaignType === "tiered" ? "Kademeli" : `%${c.earnRatio}`}
                        </span>
                        <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-center">
                          Yakında<br className="sm:hidden" /> Başlayacak
                        </div>
                      </div>"""
new_upcoming_right = """                      <div className="flex flex-col items-end justify-between h-full shrink-0">
                        <button
                          onClick={() => setEditingCampaign({ id: c.id, name: c.name, startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '', endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '', campaignType: c.campaignType, earnRatio: c.earnRatio, tiers: Array.isArray(c.tiers) ? c.tiers : (typeof c.tiers === 'string' ? JSON.parse(c.tiers) : [{limit: 1000, points: 10}]), description: c.description || '' })}
                          className="mb-2 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-white transition-all border border-amber-500/20 flex items-center gap-1.5 text-[10px] font-bold"
                        >
                          <Edit3 size={12} /> Düzenle
                        </button>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`font-black text-amber-300 ${c.campaignType === "tiered" ? "text-sm" : "text-lg"}`}>
                            {c.campaignType === "tiered" ? "Kademeli" : `%${c.earnRatio}`}
                          </span>
                        </div>
                      </div>"""
content = content.replace(old_upcoming_right, new_upcoming_right)


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
