"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Save, Loader2, Mail, MessageSquare } from "lucide-react";

interface ProfileSettingsFormProps {
  initialFirstName: string;
  initialLastName: string;
  initialUsername: string;
  email: string;
  initialMarketingSms: boolean;
  initialMarketingEmail: boolean;
  onSave: (
    firstName: string,
    lastName: string,
    smsAllowed: boolean,
    emailAllowed: boolean
  ) => Promise<void>;
  isSaving: boolean;
}

export function ProfileSettingsForm({
  initialFirstName,
  initialLastName,
  initialUsername,
  email,
  initialMarketingSms,
  initialMarketingEmail,
  onSave,
  isSaving,
}: ProfileSettingsFormProps) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [username, setUsername] = useState(initialUsername);
  const [marketingSms, setMarketingSms] = useState(initialMarketingSms);
  const [marketingEmail, setMarketingEmail] = useState(initialMarketingEmail);

  // Keep state synced with props changes (e.g. on initial load)
  useEffect(() => {
    const timer = setTimeout(() => {
      setFirstName(initialFirstName);
      setLastName(initialLastName);
      setUsername(initialUsername);
      setMarketingSms(initialMarketingSms);
      setMarketingEmail(initialMarketingEmail);
    }, 0);
    return () => clearTimeout(timer);
  }, [initialFirstName, initialLastName, initialUsername, initialMarketingSms, initialMarketingEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(firstName, lastName, marketingSms, marketingEmail);
  };

  const isFormChanged = 
    firstName !== initialFirstName || 
    lastName !== initialLastName ||
    marketingSms !== initialMarketingSms ||
    marketingEmail !== initialMarketingEmail;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Ad Soyad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="firstName" className="text-slate-400 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Ad</Label>
            <Input
              id="firstName"
              placeholder="Adınızı girin"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="bg-white/10 dark:bg-white/5 border-slate-700/20 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-cyan-500 min-h-[44px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName" className="text-slate-400 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Soyad</Label>
            <Input
              id="lastName"
              placeholder="Soyadınızı girin"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="bg-white/10 dark:bg-white/5 border-slate-700/20 dark:border-white/10 text-slate-800 dark:text-white rounded-xl focus:border-cyan-500 min-h-[44px]"
            />
          </div>
        </div>

        {/* E-posta (Salt Okunur) */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-400 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">E-posta Adresi</Label>
          <Input
            id="email"
            value={email}
            disabled={true}
            className="bg-white/5 dark:bg-white/5 border-slate-750/30 dark:border-white/10 text-slate-400 dark:text-slate-400 rounded-xl min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed bg-slate-950/40"
          />
        </div>

        {/* Kullanıcı Adı (Salt Okunur) */}
        <div className="space-y-1.5">
          <Label htmlFor="username" className="text-slate-400 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Kullanıcı Adı</Label>
          <Input
            id="username"
            placeholder="kullanici_adi"
            value={username}
            disabled={true}
            className="bg-white/5 dark:bg-white/5 border-slate-750/30 dark:border-white/10 text-slate-400 dark:text-slate-400 rounded-xl min-h-[44px] lowercase disabled:opacity-60 disabled:cursor-not-allowed bg-slate-950/40"
          />
          <p className="text-[10px] text-slate-500">
            Kullanıcı adınızı değiştirmek için lütfen sistem yöneticinizle irtibata geçin.
          </p>
        </div>

        {/* İletişim Tercihleri */}
        <div className="pt-4 border-t border-slate-800/40 dark:border-white/5 space-y-3.5">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-0.5">
            İletişim Tercihleri (Notification Preferences)
          </h4>
          
          <div className="space-y-2.5">
            {/* SMS Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-2xl border border-white/5 hover:border-cyan-500/25 bg-[#09090b]/40 hover:bg-[#0a0f1d]/50 transition-all duration-200 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={marketingSms}
                onChange={(e) => setMarketingSms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700/50 bg-[#07070a] text-cyan-500 focus:ring-cyan-500/40 focus:ring-offset-slate-950 accent-cyan-500 transition-all cursor-pointer"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1.5 transition-colors">
                  <MessageSquare size={13} className="text-cyan-400" />
                  SMS ile pazarlama/kampanya bilgilendirmesi almak istiyorum
                </span>
                <span className="text-[10px] text-slate-500">Sadakat puan kampanyaları ve özel fırsatlar kısa mesaj ile iletilir.</span>
              </div>
            </label>

            {/* E-posta Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-2xl border border-white/5 hover:border-cyan-500/25 bg-[#09090b]/40 hover:bg-[#0a0f1d]/50 transition-all duration-200 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={marketingEmail}
                onChange={(e) => setMarketingEmail(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700/50 bg-[#07070a] text-cyan-500 focus:ring-cyan-500/40 focus:ring-offset-slate-950 accent-cyan-500 transition-all cursor-pointer"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1.5 transition-colors">
                  <Mail size={13} className="text-cyan-400" />
                  E-posta ile pazarlama/kampanya bilgilendirmesi almak istiyorum
                </span>
                <span className="text-[10px] text-slate-500">Aylık puan dökümleri ve hediye katalogları kayıtlı e-posta adresinize gönderilir.</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSaving || !isFormChanged}
        className={`w-full py-4 rounded-2xl text-sm font-bold text-white shadow-lg transition-all min-h-[44px] ${
          isFormChanged && !isSaving
            ? "bg-gradient-to-r from-indigo-600 to-cyan-600 shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            : "bg-slate-700/40 cursor-not-allowed opacity-50 shadow-none text-slate-500 border border-slate-800"
        }`}
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span>Kaydediliyor...</span>
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            <span>Tercihleri ve Bilgileri Kaydet</span>
          </>
        )}
      </Button>
    </form>
  );
}

