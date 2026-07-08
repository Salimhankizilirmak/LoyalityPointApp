import re
import sys

file_path = "src/components/features/manager-dashboard/sections/CampaignSection.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Import
content = content.replace("updateCampaignDatesAction,", "updateCampaignDetailsAction,")

# 2. State
old_state = """const [editingCampaign, setEditingCampaign] = useState<{ id: string; name: string; startDate: string; endDate: string; } | null>(null);"""
new_state = """const [editingCampaign, setEditingCampaign] = useState<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    campaignType: "multiplier" | "tiered";
    earnRatio: number;
    tiers: { limit: number; points: number }[];
    description: string;
  } | null>(null);"""
content = content.replace(old_state, new_state)

# 3. handleEditCampaignSubmit
old_submit = """const res = await updateCampaignDatesAction(
      editingCampaign.id,
      editingCampaign.startDate,
      editingCampaign.endDate
    );"""
new_submit = """const res = await updateCampaignDetailsAction(editingCampaign.id, {
      name: editingCampaign.name,
      campaignType: editingCampaign.campaignType,
      earnRatio: editingCampaign.earnRatio,
      tiers: editingCampaign.campaignType === "tiered" ? editingCampaign.tiers : null,
      startDate: editingCampaign.startDate,
      endDate: editingCampaign.endDate,
      description: editingCampaign.description,
    });"""
content = content.replace(old_submit, new_submit)
content = content.replace('setEditFormError(res.error || "Kampanya tarihleri güncellenemedi.");', 'setEditFormError(res.error || "Kampanya güncellenemedi.");')

# 4. Buton onclick
def replacer(match):
    return "onClick={() => setEditingCampaign({ id: " + match.group(1) + ".id, name: " + match.group(1) + ".name, startDate: " + match.group(1) + ".startDate ? new Date(" + match.group(1) + ".startDate).toISOString().split('T')[0] : '', endDate: " + match.group(1) + ".endDate ? new Date(" + match.group(1) + ".endDate).toISOString().split('T')[0] : '', campaignType: " + match.group(1) + ".campaignType, earnRatio: " + match.group(1) + ".earnRatio, tiers: Array.isArray(" + match.group(1) + ".tiers) ? " + match.group(1) + ".tiers : (typeof " + match.group(1) + ".tiers === 'string' ? JSON.parse(" + match.group(1) + ".tiers) : [{limit: 1000, points: 10}]), description: " + match.group(1) + ".description || '' })}"

content = re.sub(r"onClick=\{\(\) => setEditingCampaign\(\{ id: (.*?)\.id, name: .*?\.name, startDate: .*? \}\)\}", replacer, content)


# 5. UI Aktif Kampanya rendering'i
old_tiered_ui = """{activeCampaign.campaignType === "tiered" ? (
                      <>
                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Kademeli</span>
                        <p className="text-xs text-emerald-300 font-bold uppercase mt-1">Kampanya</p>
                      </>
                    ) : ("""
new_tiered_ui = """{activeCampaign.campaignType === "tiered" ? (
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
                    ) : ("""
content = content.replace(old_tiered_ui, new_tiered_ui)

# 6. Modal Formu
old_modal_form = """<form onSubmit={handleEditCampaignSubmit} className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Başlangıç Tarihi</label>
                <input
                  required
                  type="date"
                  value={editingCampaign.startDate}
                  onChange={(e) => setEditingCampaign((f) => f ? ({ ...f, startDate: e.target.value }) : null)}
                  className={inputClass}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className={labelClass}>Bitiş Tarihi</label>
                <input
                  required
                  type="date"
                  value={editingCampaign.endDate}
                  min={editingCampaign.startDate}
                  onChange={(e) => setEditingCampaign((f) => f ? ({ ...f, endDate: e.target.value }) : null)}
                  className={inputClass}
                  style={{ colorScheme: 'dark' }}
                />
              </div>"""

new_modal_form = """<form onSubmit={handleEditCampaignSubmit} className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-2">
              <div>
                <label className={labelClass}>Kampanya Adı</label>
                <input
                  required
                  type="text"
                  value={editingCampaign.name}
                  onChange={(e) => setEditingCampaign((f) => f ? ({ ...f, name: e.target.value }) : null)}
                  className={inputClass}
                />
              </div>
              
              <div>
                  <label className={labelClass}>Kampanya Modeli</label>
                  <div className="grid grid-cols-2 gap-3 p-1 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setEditingCampaign(f => f ? ({ ...f, campaignType: "multiplier" }) : null)}
                      className={`py-2 text-sm font-bold rounded-lg transition-all ${editingCampaign.campaignType === "multiplier" ? "bg-cyan-500 text-white shadow-md" : "text-neutral-400 hover:text-white"}`}
                    >
                      Puan Oranını Değiştir
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCampaign(f => f ? ({ ...f, campaignType: "tiered" }) : null)}
                      className={`py-2 text-sm font-bold rounded-lg transition-all ${editingCampaign.campaignType === "tiered" ? "bg-cyan-500 text-white shadow-md" : "text-neutral-400 hover:text-white"}`}
                    >
                      Harcama Limiti Belirle
                    </button>
                  </div>
                </div>

                {editingCampaign.campaignType === "multiplier" ? (
                  <div className="bg-neutral-900/40 p-5 rounded-2xl border border-white/5 min-h-[170px]">
                    <div className="flex justify-between items-center mb-4">
                       <label className="text-xs font-bold uppercase tracking-widest text-indigo-300">Kazanım Oranı</label>
                       <span className="text-2xl font-black text-cyan-400">%{editingCampaign.earnRatio}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={editingCampaign.earnRatio}
                      onChange={(e) => setEditingCampaign((f) => f ? ({ ...f, earnRatio: Number(e.target.value) }) : null)}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                ) : (
                  <div className="bg-neutral-900/40 p-5 rounded-2xl border border-white/5 space-y-4 min-h-[170px]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-widest text-indigo-300">Kademeler & Limitler</label>
                      <button 
                        type="button"
                        onClick={() => setEditingCampaign(f => f ? ({ ...f, tiers: [...f.tiers, { limit: 0, points: 0 }] }) : null)}
                        className="text-xs text-cyan-400 font-bold bg-cyan-500/10 px-2 py-1 rounded hover:bg-cyan-500/20 transition-colors"
                      >
                        + Kademe Ekle
                      </button>
                    </div>
                    {editingCampaign.tiers.map((tier, idx) => (
                      <div key={idx} className="flex gap-3 items-end">
                        <div className="flex-1 min-w-0">
                          <label className="text-[10px] text-neutral-500 uppercase font-bold mb-1 block">Limit (TL)</label>
                          <input 
                            type="number" 
                            required 
                            min="1"
                            value={tier.limit} 
                            onChange={e => {
                              if (!editingCampaign) return;
                              const newTiers = [...editingCampaign.tiers];
                              newTiers[idx].limit = Number(e.target.value);
                              setEditingCampaign({ ...editingCampaign, tiers: newTiers });
                            }}
                            className={inputClass}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-[10px] text-neutral-500 uppercase font-bold mb-1 block">Puan</label>
                          <input 
                            type="number" 
                            required 
                            min="1"
                            value={tier.points} 
                            onChange={e => {
                              if (!editingCampaign) return;
                              const newTiers = [...editingCampaign.tiers];
                              newTiers[idx].points = Number(e.target.value);
                              setEditingCampaign({ ...editingCampaign, tiers: newTiers });
                            }}
                            className={inputClass}
                          />
                        </div>
                        {editingCampaign.tiers.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => {
                              if (!editingCampaign) return;
                              const newTiers = editingCampaign.tiers.filter((_, i) => i !== idx);
                              setEditingCampaign({ ...editingCampaign, tiers: newTiers });
                            }}
                            className="p-3 mb-1 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Başlangıç Tarihi</label>
                    <input
                      required
                      type="date"
                      value={editingCampaign.startDate}
                      onChange={(e) => setEditingCampaign((f) => f ? ({ ...f, startDate: e.target.value }) : null)}
                      className={inputClass}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Bitiş Tarihi</label>
                    <input
                      required
                      type="date"
                      value={editingCampaign.endDate}
                      min={editingCampaign.startDate}
                      onChange={(e) => setEditingCampaign((f) => f ? ({ ...f, endDate: e.target.value }) : null)}
                      className={inputClass}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
              </div>
              
              <div>
                <label className={labelClass}>Açıklama</label>
                <input
                  type="text"
                  value={editingCampaign.description}
                  onChange={(e) => setEditingCampaign((f) => f ? ({ ...f, description: e.target.value }) : null)}
                  className={inputClass}
                />
              </div>"""
content = content.replace(old_modal_form, new_modal_form)

# 7. Modal Form Buton text
content = content.replace('"Tarihleri Kaydet"', '"Kaydet"')
content = content.replace('Tarih Düzenle:', 'Kampanya Düzenle:')
content = content.replace('title="Tarihleri Düzenle"', 'title="Düzenle"')
content = content.replace('title="Tarihi Düzenle"', 'title="Düzenle"')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
