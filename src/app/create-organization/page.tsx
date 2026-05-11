"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Globe, ArrowRight, Star, Sparkles, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createBossOrganization } from "./actions";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", slug: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await createBossOrganization(form.name, form.slug);
    if (result.success) {
      router.push("/boss-dashboard");
    } else {
      setError(result.error || "Bir hata oluştu.");
      setLoading(false);
    }
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setForm({ name, slug });
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10 space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/20">
            <Star className="text-white w-10 h-10" fill="currentColor" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Fermanızı Oluşturun</h1>
            <p className="text-neutral-400">Sadakat sistemine hoş geldiniz. İşletmenizi kurarak başlayın.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 rotate-180" /> {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">İşletme Adı</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
                <input 
                  required
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Örn: Migros Ticaret"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-cyan-500 outline-none transition-all placeholder:text-neutral-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">URL Uzantısı (Slug)</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
                <input 
                  required
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  placeholder="migros-ticaret"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-white font-mono text-sm focus:border-cyan-500 outline-none transition-all placeholder:text-neutral-700"
                />
              </div>
              <p className="text-[10px] text-neutral-500 ml-1">Bu alan müşterilerinizin erişim linkinde görünecektir.</p>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 text-neutral-950 py-4 rounded-2xl font-black text-lg hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />
            ) : (
              <>
                Sistemi Başlat <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="flex items-center gap-2 justify-center py-2">
            <Sparkles className="text-cyan-500 w-4 h-4" />
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-tighter">Premium Enterprise Setup</span>
          </div>
        </form>
      </div>
    </div>
  );
}
