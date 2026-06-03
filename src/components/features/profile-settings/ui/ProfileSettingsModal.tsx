"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, ShieldCheck, AlertCircle, CheckCircle } from "lucide-react";
import { useProfileSettings } from "../hooks/useProfileSettings";
import { AvatarUpload } from "./AvatarUpload";
import { ProfileSettingsForm } from "./ProfileSettingsForm";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export function ProfileSettingsModal({ isOpen, onClose, isDarkMode = true }: ProfileSettingsModalProps) {
  const {
    user,
    username,
    phone,
    hasPhone,
    isSaving,
    isUploading,
    uploadAvatar,
    email,
    firstName,
    lastName,
    marketingSms,
    marketingEmail,
    error,
    success,
    updateProfile,
    isLoaded,
  } = useProfileSettings();

  if (!isOpen) return null;

  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : user?.fullName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "Kullanıcı";

  const displayEmail = email || user?.emailAddresses?.[0]?.emailAddress || "";
  const role = (user?.publicMetadata?.role as string) || "customer";
  
  const roleLabels: Record<string, string> = {
    super_admin: "Süper Admin",
    superadmin: "Süper Admin",
    boss: "Süper Yetkili (Patron)",
    manager: "Yönetici",
    cashier: "Kasiyer",
    customer: "Müşteri",
  };
  const roleLabel = roleLabels[role.toLowerCase()] || "Müşteri";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className={`relative w-full max-w-2xl rounded-xl border overflow-hidden shadow-2xl backdrop-blur-2xl transition-all duration-200 z-10 ${
            isDarkMode
              ? "bg-[#090b11]/95 border-slate-800 shadow-slate-950 text-white"
              : "bg-white/95 border-slate-200 shadow-slate-200 text-slate-800"
          }`}
        >
          {/* Subtle Cyber Accents */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ${
              isDarkMode
                ? "hover:bg-slate-900 text-slate-400 hover:text-white"
                : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"
            }`}
            aria-label="Kapat"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="p-5 border-b border-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">
                Profil Ayarları
              </h2>
              <p className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Kişisel bilgilerinizi ve profil resminizi güncelleyin.
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto max-h-[70vh] space-y-5">
            {/* Status alerts */}
            {error && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Profil bilgileriniz başarıyla kaydedildi!</span>
              </div>
            )}

            {!isLoaded ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-cyan-400">
                <div className="w-6 h-6 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
                <span className="text-[10px] font-semibold">Yükleniyor...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Left side: avatar */}
                <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 rounded-lg border border-slate-900 bg-slate-950/20 gap-3">
                  {user && (
                    <AvatarUpload
                      user={user}
                      onUpload={uploadAvatar}
                      isUploading={isUploading}
                    />
                  )}
                  <div className="space-y-1 w-full">
                    <h3 className="font-bold text-xs truncate">{displayName}</h3>
                    <p className={`text-[9px] font-mono truncate ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                      {displayEmail}
                    </p>
                    <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[9px] font-black uppercase tracking-wider w-fit mx-auto mt-2 select-none">
                      <ShieldCheck className="w-3 h-3 text-cyan-400" />
                      <span>{roleLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Right side: details form */}
                <div className="md:col-span-8 space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-0.5">Detaylı Bilgiler</h3>
                  <ProfileSettingsForm
                    initialFirstName={firstName}
                    initialLastName={lastName}
                    initialUsername={username}
                    email={displayEmail}
                    initialPhone={phone}
                    hasPhone={hasPhone}
                    initialMarketingSms={marketingSms}
                    initialMarketingEmail={marketingEmail}
                    onSave={updateProfile}
                    isSaving={isSaving}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
