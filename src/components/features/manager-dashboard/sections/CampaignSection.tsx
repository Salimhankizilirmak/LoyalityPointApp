"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  createCampaignAction,
  getCampaignsAction,
  deactivateCampaignAction,
  getBranchEarnRatioAction,
  updateCampaignDetailsAction,
} from "@/app/(manager)/manager-dashboard/campaign-actions";
import { Zap, Calendar, PlusCircle, CheckCircle2, XCircle, Clock, Megaphone, Settings2, Loader2, AlertTriangle, ArrowRight, Hourglass, Edit3, Trash2 } from "lucide-react";

interface Campaign {
  id: string;
  branchId: string;
  name: string;
  campaignType: "multiplier" | "tiered";
  earnRatio: number;
  tiers: any;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  description: string | null;
  createdAt: Date | null;
}

interface CampaignSectionProps {
  isDarkMode: boolean;
}

function formatDate(date: Date | null | string) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
}

function getRemainingDays(endDate: Date | null | string) {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDaysUntilStart(startDate: Date | null | string) {
  if (!startDate) return null;
  const diff = new Date(startDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

type CampaignStatus = "active" | "upcoming" | "ended";

function getCampaignStatus(campaign: Campaign): CampaignStatus {
  const now = Date.now();
  const start = campaign.startDate ? new Date(campaign.startDate).getTime() : 0;
  const end = campaign.endDate ? new Date(campaign.endDate).getTime() : Infinity;

  if (!campaign.isActive || end < now) return "ended";
  if (start > now) return "upcoming";
  return "active";
}

export function CampaignSection({ isDarkMode }: CampaignSectionProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [baseRate, setBaseRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  // Edit State
  const [editingCampaign, setEditingCampaign] = useState<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    campaignType: "multiplier" | "tiered";
    earnRatio: number;
    tiers: { limit: number; points: number }[];
    description: string;
  } | null>(null);
  const [editFormSubmitting, setEditFormSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState("");

  // Form state
  const [form, setForm] = useState<{
    name: string;
    campaignType: "multiplier" | "tiered";
    earnRatio: number;
    tiers: { limit: number; points: number }[];
    startDate: string;
    endDate: string;
    description: string;
  }>({
    name: "",
    campaignType: "multiplier",
    earnRatio: 15,
    tiers: [{ limit: 1000, points: 10 }],
    startDate: "",
    endDate: "",
    description: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [campaignRes, rateRes] = await Promise.all([
      getCampaignsAction(),
      getBranchEarnRatioAction(),
    ]);
    if (campaignRes.success) setCampaigns(campaignRes.campaigns as Campaign[]);
    if (rateRes.success) setBaseRate(rateRes.earnRatio);
    setLoading(false);
  }, []);

  const fetchedRef = React.useRef(false);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      loadData();
    }
  }, [loadData]);


  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSubmitting(true);

    const res = await createCampaignAction({
      name: form.name,
      campaignType: form.campaignType,
      earnRatio: form.earnRatio,
      tiers: form.campaignType === "tiered" ? form.tiers : null,
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description,
    });

    setFormSubmitting(false);

    if (res.success) {
      setShowForm(false);
      setForm({ name: "", campaignType: "multiplier", earnRatio: 15, tiers: [{ limit: 1000, points: 10 }], startDate: "", endDate: "", description: "" });
      await loadData();
    } else {
      setFormError(res.error || "Kampanya oluşturulamadı.");
    }
  };

  const handleDeactivate = async (campaignId: string) => {
    setDeactivating(campaignId);
    await deactivateCampaignAction(campaignId);
    setDeactivating(null);
    await loadData();
  };

  const handleEditCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    setEditFormError("");
    setEditFormSubmitting(true);

    const res = await updateCampaignDetailsAction(editingCampaign.id, {
      name: editingCampaign.name,
      campaignType: editingCampaign.campaignType,
      earnRatio: editingCampaign.earnRatio,
      tiers: editingCampaign.campaignType === "tiered" ? editingCampaign.tiers : null,
      startDate: editingCampaign.startDate,
      endDate: editingCampaign.endDate,
      description: editingCampaign.description,
    });

    setEditFormSubmitting(false);

    if (res.success) {
      setEditingCampaign(null);
      await loadData();
    } else {
      setEditFormError(res.error || "Kampanya güncellenemedi.");
    }
  };

  const activeCampaign = campaigns.find((c) => getCampaignStatus(c) === "active");
  const upcomingCampaigns = campaigns.filter((c) => getCampaignStatus(c) === "upcoming");
  const pastCampaigns = campaigns.filter((c) => getCampaignStatus(c) === "ended");

  // Neon theme classes inspired by LandingContent
  const cardBase = "relative p-6 rounded-3xl border border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl shadow-lg";
  const glowHover = "group hover:border-indigo-500/30 transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]";

  const labelClass = "text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2 block";
  const inputClass = "w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-900/60 text-white placeholder-neutral-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all";

  // Derived KPI values
  const remainingDays = activeCampaign ? getRemainingDays(activeCampaign.endDate) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="animate-spin text-cyan-400" size={28} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-white w-full max-w-7xl">

      {/* ─── KPI Ribbon ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Aktif Kampanya */}
        <div className="bg-[#0a0a0f]/60 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/10 to-cyan-600/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Megaphone size={18} className="text-cyan-400" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 block">Aktif Kampanya</span>
            <span className="text-sm font-bold text-white truncate block">
              {activeCampaign ? activeCampaign.name : "Aktif kampanya yok"}
            </span>
          </div>
        </div>

        {/* KPI: Kalan Gün */}
        <div className="bg-[#0a0a0f]/60 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/10 to-cyan-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Clock size={18} className="text-cyan-400" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 block">Kalan Gün</span>
            <span className="text-2xl font-black text-white">
              {remainingDays !== null ? remainingDays : "—"}
            </span>
          </div>
        </div>

        {/* KPI: Standart Kazanım Oranı */}
        <div className="bg-[#0a0a0f]/60 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/10 to-cyan-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Zap size={18} className="text-cyan-400" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 block">Standart Oran</span>
            <span className="text-2xl font-black text-white">
              {baseRate !== null ? `%${baseRate}` : "—"}
            </span>
          </div>
        </div>

        {/* KPI: Geçmiş Kampanyalar */}
        <div className="bg-[#0a0a0f]/60 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/10 to-cyan-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Calendar size={18} className="text-cyan-400" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 block">Geçmiş Kampanyalar</span>
            <span className="text-2xl font-black text-white">{pastCampaigns.length}</span>
          </div>
        </div>
      </div>

      {/* ─── Two Column Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* ─── Sol Sütun ─── */}
        <div className="flex flex-col gap-6 min-w-0">


          {/* Yeni Kampanya Oluştur Butonu / Formu */}
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className={`w-full py-5 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 border border-indigo-500/30 transition-all cursor-pointer shadow-[0_0_20px_rgba(79,70,229,0.15)] disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600/20 to-cyan-600/20 text-white hover:from-indigo-600/40 hover:to-cyan-600/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]`}
            >
              <PlusCircle size={22} className="text-cyan-400" />
              Yeni Kampanya Oluştur
            </button>
          ) : (
            <div className={`${cardBase} border-indigo-500/30`}>
              <div className="absolute inset-0 bg-indigo-500/5 blur-[50px] -z-10" />

              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-2xl text-white flex items-center gap-3">
                   <Zap className="text-cyan-400" size={24} /> Yeni Kampanya
                </h3>
                <button onClick={() => { setShowForm(false); setFormError(""); }} className="text-neutral-500 hover:text-white transition-colors cursor-pointer bg-white/5 p-2 rounded-full">
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} className="flex flex-col gap-6">
                <div>
                  <label className={labelClass}>Kampanya Adı</label>
                  <input
                    required
                    type="text"
                    placeholder="Örn: Yaz Kampanyası 2026"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                {/* Kampanya Modeli Seçimi */}
                <div>
                  <label className={labelClass}>Kampanya Modeli</label>
                  <div className="grid grid-cols-2 gap-3 p-1 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, campaignType: "multiplier" }))}
                      className={`py-2 text-sm font-bold rounded-lg transition-all ${form.campaignType === "multiplier" ? "bg-cyan-500 text-white shadow-md" : "text-neutral-400 hover:text-white"}`}
                    >
                      Puan Oranını Değiştir
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, campaignType: "tiered" }))}
                      className={`py-2 text-sm font-bold rounded-lg transition-all ${form.campaignType === "tiered" ? "bg-cyan-500 text-white shadow-md" : "text-neutral-400 hover:text-white"}`}
                    >
                      Harcama Limiti Belirle
                    </button>
                  </div>
                </div>

                {form.campaignType === "multiplier" ? (
                  <div className="bg-neutral-900/40 p-5 rounded-2xl border border-white/5 min-h-[170px]">
                    <div className="flex justify-between items-center mb-4">
                       <label className="text-xs font-bold uppercase tracking-widest text-indigo-300">Kazanım Oranı</label>
                       <span className="text-2xl font-black text-cyan-400">%{form.earnRatio}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={form.earnRatio}
                      onChange={(e) => setForm((f) => ({ ...f, earnRatio: Number(e.target.value) }))}
                      className="w-full accent-cyan-400"
                    />
                    <div className="flex justify-between text-xs text-neutral-500 mt-2 font-medium">
                      <span>%1</span>
                      <span>%100</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-900/40 p-5 rounded-2xl border border-white/5 space-y-4 min-h-[170px]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-widest text-indigo-300">Kademeler & Limitler</label>
                      <button 
                        type="button"
                        onClick={() => setForm(f => ({ ...f, tiers: [...f.tiers, { limit: 0, points: 0 }] }))}
                        className="text-xs text-cyan-400 font-bold bg-cyan-500/10 px-2 py-1 rounded hover:bg-cyan-500/20 transition-colors"
                      >
                        + Kademe Ekle
                      </button>
                    </div>
                    {form.tiers.map((tier, idx) => (
                      <div key={idx} className="flex gap-3 items-end">
                        <div className="flex-1 min-w-0">
                          <label className="text-[10px] text-neutral-500 uppercase font-bold mb-1 block">Alışveriş Limiti (TL)</label>
                          <input 
                            type="number" 
                            required 
                            min="1"
                            value={tier.limit} 
                            onChange={e => {
                              const newTiers = [...form.tiers];
                              newTiers[idx].limit = Number(e.target.value);
                              setForm(f => ({ ...f, tiers: newTiers }));
                            }}
                            className={inputClass}
                            placeholder="Örn: 1000"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-[10px] text-neutral-500 uppercase font-bold mb-1 block">Kazanılacak Puan</label>
                          <input 
                            type="number" 
                            required 
                            min="1"
                            value={tier.points} 
                            onChange={e => {
                              const newTiers = [...form.tiers];
                              newTiers[idx].points = Number(e.target.value);
                              setForm(f => ({ ...f, tiers: newTiers }));
                            }}
                            className={inputClass}
                            placeholder="Örn: 10"
                          />
                        </div>
                        {form.tiers.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => {
                              const newTiers = form.tiers.filter((_, i) => i !== idx);
                              setForm(f => ({ ...f, tiers: newTiers }));
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Başlangıç Tarihi</label>
                    <input
                      required
                      type="date"
                      value={form.startDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                      className={inputClass}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Bitiş Tarihi</label>
                    <input
                      required
                      type="date"
                      value={form.endDate}
                      min={form.startDate || new Date().toISOString().split("T")[0]}
                      onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                      className={inputClass}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Açıklama (Opsiyonel)</label>
                  <input
                    type="text"
                    placeholder="Kampanya hakkında kısa not..."
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className={inputClass}
                  />
                </div>

                {formError && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full py-4 rounded-xl text-base font-bold tracking-wide bg-gradient-to-r from-indigo-600 to-cyan-500 text-white hover:from-indigo-500 hover:to-cyan-400 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                >
                  {formSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                  {formSubmitting ? "Oluşturuluyor..." : "Kampanyayı Başlat"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ─── Sağ Sütun ─── */}
        <div className="flex flex-col gap-6 min-w-0">

          {/* Aktif Kampanya */}
          {activeCampaign ? (
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

              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)] shrink-0">
                    <Megaphone size={24} className="text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1 block">Aktif Kampanya</span>
                    <div className="mb-2">
                      <h3 className="font-bold text-2xl tracking-tight text-white">
                        {activeCampaign.name}
                      </h3>
                    </div>
                    {activeCampaign.description && (
                      <p className="text-sm text-neutral-300 italic mb-4">{activeCampaign.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                      <div className="flex items-center gap-2 bg-neutral-900/60 px-3 py-1.5 rounded-lg border border-neutral-700">
                        <Calendar size={14} className="text-indigo-400" />
                        <span className="text-neutral-300">{formatDate(activeCampaign.startDate)} – {formatDate(activeCampaign.endDate)}</span>
                      </div>
                      {getRemainingDays(activeCampaign.endDate) !== null && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                          (getRemainingDays(activeCampaign.endDate) ?? 0) <= 3
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        }`}>
                          <Clock size={14} />
                          <span>{getRemainingDays(activeCampaign.endDate)} gün kaldı</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch justify-between mt-4 gap-4">
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
                  </div>

                  <button
                    onClick={() => handleDeactivate(activeCampaign.id)}
                    disabled={deactivating === activeCampaign.id}
                    className="px-6 py-2.5 rounded-full text-sm font-bold tracking-wider text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {deactivating === activeCampaign.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                    Kampanyayı Sonlandır
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={`relative p-8 rounded-3xl border border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl text-center group transition-all`}>
               <div className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-inner">
                <Megaphone size={28} className="text-indigo-400/50 group-hover:text-cyan-400 transition-colors" />
              </div>
              <p className="text-lg font-bold text-white mb-2">Aktif kampanya yok</p>
              <p className="text-sm text-neutral-400 max-w-sm mx-auto">Yeni kampanya oluşturarak müşterilerinize ekstra puan kazandırabilir, satışlarınızı artırabilirsiniz.</p>
            </div>
          )}

          {/* Başlayacak Kampanyalar */}
          {upcomingCampaigns.length > 0 && (
            <div>
              <h3 className="font-bold text-lg text-white mb-4 tracking-tight flex items-center gap-2">
                <Hourglass size={18} className="text-amber-400" />
                Başlayacak Kampanyalar
              </h3>
              <div className="flex flex-col gap-3">
                {upcomingCampaigns.map((c) => {
                  const daysUntil = getDaysUntilStart(c.startDate);
                  return (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-md flex items-center justify-between hover:border-amber-500/30 hover:bg-amber-500/10 transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="text-base font-bold text-white truncate">{c.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-neutral-400 truncate">{formatDate(c.startDate)} – {formatDate(c.endDate)}</p>
                        </div>
                        {daysUntil !== null && daysUntil > 0 && (
                          <p className="text-xs text-amber-400 mt-1 font-medium">{daysUntil} gün sonra başlayacak</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end justify-between h-full shrink-0">
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
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Geçmiş Kampanyalar */}
          {pastCampaigns.length > 0 && (
            <div>
              <h3 className="font-bold text-lg text-white mb-4 tracking-tight flex items-center gap-2">
                <Calendar size={18} className="text-neutral-400" />
                Geçmiş Kampanyalar
              </h3>
              <div className="flex flex-col gap-3">
                {pastCampaigns.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl border border-white/5 bg-[#0a0a0f]/50 backdrop-blur-md flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-base font-bold text-neutral-200 truncate">{c.name}</p>
                      <p className="text-xs text-neutral-400 mt-1 truncate">{formatDate(c.startDate)} – {formatDate(c.endDate)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-black text-neutral-400 ${c.campaignType === "tiered" ? "text-sm" : "text-lg"}`}>
                        {c.campaignType === "tiered" ? "Kademeli" : `%${c.earnRatio}`}
                      </span>
                      <div className="text-[10px] mt-1 font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-500/10 text-neutral-500 border border-neutral-500/20 inline-block">
                        Sona Erdi
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Tarih Düzenleme Modal'ı ─── */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`${cardBase} w-full max-w-md border-indigo-500/30`}>
            <div className="absolute inset-0 bg-indigo-500/5 blur-[50px] -z-10" />
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl text-white">
                 Kampanya Düzenle: <span className="text-cyan-400">{editingCampaign.name}</span>
              </h3>
              <button onClick={() => { setEditingCampaign(null); setEditFormError(""); }} className="text-neutral-500 hover:text-white transition-colors cursor-pointer bg-white/5 p-2 rounded-full">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleEditCampaignSubmit} className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-2">
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
              </div>

              {editFormError && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{editFormError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={editFormSubmitting}
                className="mt-2 w-full py-3 rounded-xl text-sm font-bold tracking-wide bg-gradient-to-r from-indigo-600 to-cyan-500 text-white hover:from-indigo-500 hover:to-cyan-400 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {editFormSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {editFormSubmitting ? "Güncelleniyor..." : "Kaydet"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
