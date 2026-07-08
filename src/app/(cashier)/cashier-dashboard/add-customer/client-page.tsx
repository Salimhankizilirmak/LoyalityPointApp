"use client";

import { useState, useEffect } from "react";
import { useCashierDashboard } from "@/components/features/cashier-dashboard/hooks/useCashierDashboard";
import { InviteDrawer } from "@/components/features/cashier-dashboard/ui/InviteDrawer";
import { UserCheck, Phone, Mail, User, UserPlus } from "lucide-react";
import { InviteProgressModal } from "@/components/features/cashier-dashboard/modals/InviteProgressModal";

export default function AddCustomerClientPage() {
  const { state, actions } = useCashierDashboard(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  const [isInviteDrawerOpen, setIsInviteDrawerOpen] = useState(false);

  // Yeni Müşteri Ekle form state
  const [newCustForm, setNewCustForm] = useState({ name: "", phone: "", email: "" });
  const [newCustSubmitting, setNewCustSubmitting] = useState(false);
  const [newCustSuccess, setNewCustSuccess] = useState("");
  const [newCustError, setNewCustError] = useState("");

  const isNewCustPhoneValid = /^05\d{9}$/.test(newCustForm.phone);
  const isNewCustEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(newCustForm.email.trim());
  const isNewCustNameValid = newCustForm.name.trim().length > 0;
  const isNewCustFormValid = isNewCustPhoneValid && isNewCustEmailValid && isNewCustNameValid;

  const handleNewCustPhoneInput = (val: string) => {
    const numeric = val.replace(/\D/g, "");
    if (numeric.length <= 11) setNewCustForm((f) => ({ ...f, phone: numeric }));
  };

  const handleAddNewCustomer = async () => {
    if (!isNewCustFormValid) return;
    setNewCustSubmitting(true);
    setNewCustError("");
    setNewCustSuccess("");
    try {
      const { registerCustomerAction } = await import("@/app/(cashier)/cashier-dashboard/actions");
      const res = await registerCustomerAction(newCustForm.name.trim(), newCustForm.phone.trim(), newCustForm.email.trim());
      if (res.success) {
        setNewCustSuccess("Müşteri başarıyla eklendi!");
        setNewCustForm({ name: "", phone: "", email: "" });
        setTimeout(() => setNewCustSuccess(""), 3000);
      } else {
        setNewCustError((res as any).error || "Bir hata oluştu.");
      }
    } catch {
      setNewCustError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setNewCustSubmitting(false);
    }
  };

  const handleInviteCustomer = async () => {
    await actions.handleInviteCustomer();
  };

  return (
    <div className={`flex flex-col flex-1 p-6 h-full ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
      
      <div className={`rounded-2xl border p-8 w-full flex-1 flex flex-col justify-center ${
        isDarkMode ? "bg-slate-900/60 border-indigo-500/10" : "bg-white border-slate-200"
      }`}>

        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
          {/* Ad Soyad */}
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              required
              placeholder="Ad Soyad"
              value={newCustForm.name}
              onChange={(e) => setNewCustForm((f) => ({ ...f, name: e.target.value }))}
              className={`w-full h-14 pl-12 pr-4 rounded-xl border text-lg outline-none transition-all placeholder-slate-500 ${
                isDarkMode
                  ? "bg-slate-800 border-slate-700 text-white focus:border-cyan-500"
                  : "bg-slate-50 border-slate-200 text-slate-800 focus:border-cyan-500"
              }`}
            />
          </div>

          {/* Telefon */}
          <div className="relative">
            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              required
              inputMode="numeric"
              placeholder="05XXXXXXXXX"
              value={newCustForm.phone}
              maxLength={11}
              onChange={(e) => handleNewCustPhoneInput(e.target.value)}
              className={`w-full h-14 pl-12 pr-4 rounded-xl border text-lg font-mono outline-none transition-all placeholder-slate-500 ${
                isDarkMode
                  ? "bg-slate-800 border-slate-700 text-white focus:border-cyan-500"
                  : "bg-slate-50 border-slate-200 text-slate-800 focus:border-cyan-500"
              }`}
            />
          </div>

          {/* E-posta */}
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              required
              placeholder="E-posta"
              value={newCustForm.email}
              onChange={(e) => setNewCustForm((f) => ({ ...f, email: e.target.value }))}
              className={`w-full h-14 pl-12 pr-4 rounded-xl border text-lg outline-none transition-all placeholder-slate-500 ${
                newCustForm.email.length > 0 && !isNewCustEmailValid
                  ? "border-rose-500 bg-rose-500/5 focus:border-rose-500 text-rose-500"
                  : isDarkMode
                  ? "bg-slate-800 border-slate-700 text-white focus:border-cyan-500"
                  : "bg-slate-50 border-slate-200 text-slate-800 focus:border-cyan-500"
              }`}
            />
            {newCustForm.email.length > 0 && !isNewCustEmailValid && (
              <p className="text-xs text-rose-500 mt-2 ml-2 font-medium">
                Geçerli bir email giriniz (Türkçe karakter kullanılamaz).
              </p>
            )}
          </div>
        </div>

        {/* Mesajlar */}
        {newCustSuccess && (
          <div className="mt-4 max-w-4xl mx-auto w-full text-sm font-bold text-emerald-400 bg-emerald-500/10 px-4 py-3 rounded-lg border border-emerald-500/20 flex items-center gap-2">
            ✅ {newCustSuccess}
          </div>
        )}
        {newCustError && (
          <div className="mt-4 max-w-4xl mx-auto w-full text-sm font-bold text-red-400 bg-red-500/10 px-4 py-3 rounded-lg border border-red-500/20">
            {newCustError}
          </div>
        )}

        <div className="max-w-4xl mx-auto w-full">
          <button
            onClick={handleAddNewCustomer}
            disabled={!isNewCustFormValid || newCustSubmitting}
            id="btn-add-new-customer"
            className={`mt-4 w-full py-5 rounded-xl text-lg font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
              isNewCustFormValid
                ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white hover:from-cyan-500 hover:to-cyan-400 shadow-xl shadow-cyan-500/20 active:scale-[0.98]"
                : isDarkMode
                ? "bg-slate-800 border border-slate-700 text-slate-500"
                : "bg-slate-100 border border-slate-200 text-slate-400"
            }`}
          >
            <UserCheck size={24} />
            <span>{newCustSubmitting ? "Kaydediliyor..." : "Kaydı Tamamla"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
