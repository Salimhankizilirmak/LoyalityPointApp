"use client";

import { useProfileSettings } from "../hooks/useProfileSettings";
import { AvatarUpload } from "./AvatarUpload";
import { ProfileSettingsForm } from "./ProfileSettingsForm";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { AlertCircle, CheckCircle, User, ShieldCheck } from "lucide-react";

export function ProfileSettingsPage() {
  const {
    user,
    isLoaded,
    firstName,
    lastName,
    username,
    email,
    marketingSms,
    marketingEmail,
    isSaving,
    isUploading,
    error,
    success,
    updateProfile,
    uploadAvatar,
  } = useProfileSettings();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin-reverse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl max-w-md">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 dark:text-white">Oturum Bulunamadı</h3>
          <p className="text-xs text-slate-500 mt-1">Lütfen giriş yapıp tekrar deneyin.</p>
        </div>
      </div>
    );
  }

  // Display name guard with e-mail fallback
  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.fullName || user.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "Kullanıcı";

  const role = (user.publicMetadata?.role as string) || "user";
  const roleLabels: Record<string, string> = {
    super_admin: "Süper Admin",
    superadmin: "Süper Admin",
    boss: "Süper Yetkili (Patron)",
    manager: "Yönetici",
    cashier: "Kasiyer",
    customer: "Müşteri",
  };
  const roleLabel = roleLabels[role.toLowerCase()] || "Kullanıcı";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-px h-4 bg-indigo-500" />
          <span className="text-indigo-400 text-xs font-semibold uppercase tracking-widest font-mono">Hesap Yönetimi</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          Profil Ayarları
        </h1>
        <p className="text-slate-500 text-xs">
          Kişisel bilgilerinizi ve profil resminizi güncelleyin.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Avatar Panel */}
        <GlassPanel className="p-6 flex flex-col items-center justify-center text-center gap-6" elevated>
          <AvatarUpload 
            user={user} 
            onUpload={uploadAvatar} 
            isUploading={isUploading} 
          />
          
          <div className="border-t border-slate-700/20 dark:border-white/10 pt-4 w-full space-y-2">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate">
              {displayName}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              {email}
            </p>
            <div className="flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-wider w-fit mx-auto mt-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{roleLabel}</span>
            </div>
          </div>
        </GlassPanel>

        {/* Right Side: Details Form Panel */}
        <GlassPanel className="p-6 md:col-span-2 space-y-6" elevated>
          <div className="flex items-center gap-3 border-b border-slate-700/10 dark:border-white/10 pb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-800 dark:text-white">Profil Bilgileri</h2>
              <p className="text-[10px] text-slate-500">Adınızı, soyadınızı ve kullanıcı adınızı değiştirin.</p>
            </div>
          </div>

           <ProfileSettingsForm
            initialFirstName={firstName}
            initialLastName={lastName}
            initialUsername={username}
            email={email || user?.emailAddresses?.[0]?.emailAddress || ""}
            initialMarketingSms={marketingSms}
            initialMarketingEmail={marketingEmail}
            onSave={updateProfile}
            isSaving={isSaving}
          />
        </GlassPanel>
      </div>
    </div>
  );
}
