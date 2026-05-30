"use client";

import { useActionState, useState } from "react";
import { saveUsernameAction } from "@/app/(boss)/boss-dashboard/actions";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";

export default function UsernameWarningBanner() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const [state, formAction, isPending] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      const res = await saveUsernameAction(prevState, formData);
      if (res.success) {
        setIsOpen(false);
        router.refresh();
      }
      return res;
    },
    { success: false, error: "" }
  );

  return (
    <>
      {/* ⚠️ Soft-Blocking Banner */}
      <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400 transition-colors duration-300 relative z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-amber-600 dark:text-amber-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold tracking-tight">Sistemi tam yetkiyle kullanabilmek ve terminallerden hızlı giriş yapabilmek için bir kullanıcı adı belirlemelisiniz.</span>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-[#09090b] font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            Kullanıcı Adı Oluştur
          </button>
        </div>
      </div>

      {/* 🪟 Modern Glassmorphism Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#18181b]/55 backdrop-blur-md border border-slate-200 dark:border-neutral-800/80 rounded-2xl p-8 shadow-2xl relative z-10 transition-all duration-300 hover:border-slate-350 dark:hover:border-neutral-700/80">
            {/* Kapat Butonu */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Logo / Simge */}
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-blue-500/15">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white animate-pulse">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
            </div>

            {/* Başlık ve Açıklama */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
                Kullanıcı Adı Belirleyin
              </h1>
              <p className="text-sm text-slate-500 dark:text-neutral-400 leading-relaxed px-2">
                Sisteme diğer cihazlardan e-posta onayı gerekmeden, sadece kullanıcı adınız ve şifrenizle anında giriş yapabilmek için kurumsal bir kullanıcı adı tanımlayın.
              </p>
            </div>

            {/* Form */}
            <form action={formAction} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="username" className="block text-xs font-semibold text-slate-500 dark:text-neutral-300 uppercase tracking-wider">
                  Kullanıcı Adı
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-neutral-500">
                    <span className="text-sm font-medium">@</span>
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    required
                    placeholder="isletmeadi"
                    className="block w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-[#09090b]/80 dark:border-neutral-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                    disabled={isPending}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 leading-normal pl-1">
                  Sadece küçük harf, rakam, nokta (.) ve alt çizgi (_) kullanabilirsiniz. (En az 3 karakter)
                </p>
              </div>

              {/* Hata Mesajı */}
              {state?.error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 animate-fadeIn">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mt-0.5 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  <span className="leading-relaxed">{state.error}</span>
                </div>
              )}

              {/* Kaydet Butonu */}
              <button
                type="submit"
                disabled={isPending}
                className="relative w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
              >
                {isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Kaydediliyor...</span>
                  </div>
                ) : (
                  <span>Kullanıcı Adını Kaydet</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
