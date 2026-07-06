"use client";

import { useState } from "react";
import { UserPlus, Mail, Phone, User, Store, Loader2, CheckCircle2 } from "lucide-react";
import { inviteEmployee } from "../actions";

interface InviteManagerClientProps {
  branches: { id: string | number; name: string }[];
}

export function InviteManagerClient({ branches }: InviteManagerClientProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    branch: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!formData.branch) {
      setError("Lütfen bir şube seçin. Yöneticiler bir şubeye atanmak zorundadır.");
      return;
    }

    setLoading(true);

    try {
      const res = await inviteEmployee({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: "manager",
        branch: formData.branch,
      });

      if (res?.success) {
        setSuccess(true);
        setFormData({ name: "", email: "", phone: "", branch: "" });
      } else {
        setError((res as any)?.error || "Davet gönderilirken bir hata oluştu.");
      }
    } catch (err: any) {
      setError(err.message || "Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <UserPlus className="text-indigo-400" size={28} /> Yönetici Davet Et
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Şubenizi yönetecek kişiyi sisteme davet edin. Davet edilen yönetici seçilen şubeye atanacaktır.
        </p>
      </div>

      <div className="glass-panel bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-bold">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm font-bold flex items-center gap-2">
              <CheckCircle2 size={18} /> Yönetici daveti başarıyla gönderildi!
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ad Soyad</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-500" />
                </div>
                <input
                  required
                  type="text"
                  placeholder="Örn: Ahmet Yılmaz"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">E-posta Adresi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-500" />
                </div>
                <input
                  required
                  type="email"
                  placeholder="Örn: ahmet@sirket.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Telefon Numarası</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone size={18} className="text-slate-500" />
                </div>
                <input
                  required
                  type="tel"
                  placeholder="Örn: +90 532 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Şube Seçimi (Zorunlu)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Store size={18} className="text-indigo-400" />
                </div>
                <select
                  required
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 pl-12 pr-10 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>Şube Seçin</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Yönetici yalnızca seçilen şubeye ait işlemleri görüntüleyebilir ve yönetebilir.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || branches.length === 0}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <UserPlus size={20} /> Davet Gönder
              </>
            )}
          </button>
          
          {branches.length === 0 && (
            <p className="text-center text-xs text-rose-400 font-bold mt-2">
              Sistemde kayıtlı şubeniz bulunmamaktadır. Lütfen önce bir şube oluşturun.
            </p>
          )}

        </form>
      </div>
    </div>
  );
}
