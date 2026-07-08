import sys

file_path = "src/components/features/manager-dashboard/sections/CampaignSection.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_block = """<div className="flex items-center justify-between mt-4">
                  <div className="text-center bg-neutral-900/60 px-6 py-4 rounded-2xl border border-emerald-500/20 shadow-inner">
                    {activeCampaign.campaignType === "tiered" ? (
                      <div className="flex flex-col gap-2 items-center">
                        <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Kademeli Kampanya</span>
                        <div className="flex flex-col gap-1 w-full text-left mt-2">
                          {(Array.isArray(activeCampaign.tiers) ? activeCampaign.tiers : (typeof activeCampaign.tiers === 'string' ? JSON.parse(activeCampaign.tiers) : [])).map((t: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-sm border-b border-emerald-500/10 pb-1">
                              <span className="text-emerald-200">{t.limit} ₺ ve üzeri</span>
                              <span className="font-bold text-emerald-400">+{t.points} Puan</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 tabular-nums">%{activeCampaign.earnRatio}</span>
                        <p className="text-xs text-emerald-300 font-bold uppercase mt-1">Kazanım</p>
                      </>
                    )}
                  </div>"""

new_block = """<div className="flex flex-col sm:flex-row items-stretch justify-between mt-4 gap-4">
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

if old_block in content:
    content = content.replace(old_block, new_block)
else:
    print("Eski blok bulunamadı, script başarısız.")
    sys.exit(1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
