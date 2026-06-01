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

  if (!isOpen) return null;

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
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
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-2xl rounded-3xl border overflow-hidden shadow-2xl backdrop-blur-2xl transition-all duration-300 z-10 ${
            isDarkMode
              ? "bg-[#0b0f19]/90 border-cyan-500/20 shadow-cyan-500/5 text-white"
              : "bg-white/95 border-slate-200 shadow-slate-200 text-slate-800"
          }`}
        >
          {/* Neon corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
              isDarkMode
                ? "hover:bg-white/10 text-slate-400 hover:text-white"
                : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"
            }`}
            aria-label="Kapat"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">
                Profil Ayarları
              </h2>
              <p className={`text-[11px] font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Kişisel bilgilerinizi ve profil resminizi güncelleyin.
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
            {/* Status alerts */}
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {!isLoaded ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-cyan-400">
                <div className="w-8 h-8 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
                <span className="text-xs font-semibold">Yükleniyor...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Left side: avatar */}
                <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 rounded-2xl border border-white/5 bg-white/[0.01] gap-4">
                  {user && (
                    <AvatarUpload
                      user={user}
                      onUpload={uploadAvatar}
                      isUploading={isUploading}
                    />
                  )}
                  <div className="space-y-1 w-full">
                    <h3 className="font-bold text-sm truncate">{displayName}</h3>
                    <p className={`text-[10px] font-mono truncate ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                      {displayEmail}
                    </p>
                    <div className="flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-wider w-fit mx-auto mt-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{roleLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Right side: details form */}
                <div className="md:col-span-8 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Detaylı Bilgiler</h3>
                  <ProfileSettingsForm
                    initialFirstName={firstName}
                    initialLastName={lastName}
                    initialUsername={username}
                    email={displayEmail}
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

