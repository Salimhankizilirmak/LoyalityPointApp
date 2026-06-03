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
  initialPhone: string;
  hasPhone: boolean;
  initialMarketingSms: boolean;
  initialMarketingEmail: boolean;
  onSave: (
    firstName: string,
    lastName: string,
    phone: string,
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
  initialPhone,
  hasPhone,
  initialMarketingSms,
  initialMarketingEmail,
  onSave,
  isSaving,
}: ProfileSettingsFormProps) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [username, setUsername] = useState(initialUsername);
  const [phone, setPhone] = useState(initialPhone);
  const [marketingSms, setMarketingSms] = useState(initialMarketingSms);
  const [marketingEmail, setMarketingEmail] = useState(initialMarketingEmail);

  // Sync internal state with prop changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setFirstName(initialFirstName);
      setLastName(initialLastName);
      setUsername(initialUsername);
      setPhone(initialPhone);
      setMarketingSms(initialMarketingSms);
      setMarketingEmail(initialMarketingEmail);
    }, 0);
    return () => clearTimeout(timer);
  }, [initialFirstName, initialLastName, initialUsername, initialPhone, initialMarketingSms, initialMarketingEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(firstName, lastName, phone, marketingSms, marketingEmail);
  };

  const isFormChanged =
    firstName !== initialFirstName ||
    lastName !== initialLastName ||
    phone !== initialPhone ||
    marketingSms !== initialMarketingSms ||
    marketingEmail !== initialMarketingEmail;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        {/* Name Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="firstName" className="text-slate-400 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider pl-0.5">Ad</Label>
            <Input
              id="firstName"
              placeholder="Adınız"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="bg-slate-900/40 border border-slate-800 text-slate-200 rounded-lg focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all min-h-[40px] text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lastName" className="text-slate-400 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider pl-0.5">Soyad</Label>
            <Input
              id="lastName"
              placeholder="Soyadınız"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="bg-slate-900/40 border border-slate-800 text-slate-200 rounded-lg focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all min-h-[40px] text-sm"
            />
          </div>
        </div>

        {/* Read-only Email */}
        <div className="space-y-1">
          <Label htmlFor="email" className="text-slate-400 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider pl-0.5">E-posta Adresi</Label>
          <Input
            id="email"
            value={email}
            disabled={true}
            readOnly={true}
            className="bg-slate-950/60 border border-slate-900 text-slate-500 rounded-lg min-h-[40px] text-sm disabled:opacity-50 disabled:cursor-not-allowed select-none"
          />
        </div>

        {/* Read-only Username */}
        <div className="space-y-1">
          <Label htmlFor="username" className="text-slate-400 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider pl-0.5">Kullanıcı Adı</Label>
          <Input
            id="username"
            value={username}
            disabled={true}
            readOnly={true}
            className="bg-slate-950/60 border border-slate-900 text-slate-500 rounded-lg min-h-[40px] text-sm disabled:opacity-50 disabled:cursor-not-allowed select-none lowercase"
          />
          <p className="text-[10px] text-slate-500 pl-0.5">
            Kullanıcı adınızı değiştirmek için lütfen sistem yöneticinizle irtibata geçin.
          </p>
        </div>

        {/* Phone Input (Read-only if exists) */}
        <div className="space-y-1">
          <Label htmlFor="phone" className="text-slate-400 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider pl-0.5">Telefon Numarası</Label>
          <Input
            id="phone"
            placeholder="+905554443322"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={hasPhone}
            className="bg-slate-900/40 border border-slate-800 text-slate-200 rounded-lg focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all min-h-[40px] text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-950/60"
          />
          {hasPhone ? (
            <p className="text-[10px] text-slate-500 pl-0.5">
              Telefon numaranız sadakat sisteminizle eşleştirilmiştir ve değiştirilemez.
            </p>
          ) : (
            <p className="text-[10px] text-cyan-400 font-medium pl-0.5">
              Eşleşme ve puan kazanımı için telefon numaranızı ekleyin. Bir kez ekledikten sonra değiştiremezsiniz.
            </p>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="pt-4 border-t border-slate-900/80 space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-0.5">
            İletişim Tercihleri (Notification Preferences)
          </h4>
          
          <div className="space-y-2">
            {/* SMS Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-900 hover:border-cyan-500/20 bg-slate-950/30 hover:bg-slate-950/50 transition-all duration-150 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={marketingSms}
                onChange={(e) => setMarketingSms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-cyan-500/30 focus:ring-offset-slate-950 accent-cyan-500 cursor-pointer transition-all"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-300 group-hover:text-slate-100 flex items-center gap-1.5 transition-colors">
                  <MessageSquare size={13} className="text-cyan-400" />
                  SMS ile pazarlama/kampanya bilgilendirmesi almak istiyorum
                </span>
                <span className="text-[10px] text-slate-500">Sadakat puan kampanyaları ve özel fırsatlar kısa mesaj ile iletilir.</span>
              </div>
            </label>

            {/* E-posta Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-900 hover:border-cyan-500/20 bg-slate-950/30 hover:bg-slate-950/50 transition-all duration-150 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={marketingEmail}
                onChange={(e) => setMarketingEmail(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-cyan-500/30 focus:ring-offset-slate-950 accent-cyan-500 cursor-pointer transition-all"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-300 group-hover:text-slate-100 flex items-center gap-1.5 transition-colors">
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
        className={`w-full py-3 rounded-lg text-xs font-bold text-white shadow-sm transition-all min-h-[40px] border ${
          isFormChanged && !isSaving
            ? "bg-slate-100 hover:bg-slate-200 text-slate-950 border-slate-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] cursor-pointer"
            : "bg-slate-900/40 border-slate-900 text-slate-500 cursor-not-allowed opacity-40 shadow-none"
        }`}
      >
        {isSaving ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            <span>Kaydediliyor...</span>
          </>
        ) : (
          <>
            <Save className="w-3.5 h-3.5 mr-1.5" />
            <span>Tercihleri ve Bilgileri Kaydet</span>
          </>
        )}
      </Button>
    </form>
  );
}
