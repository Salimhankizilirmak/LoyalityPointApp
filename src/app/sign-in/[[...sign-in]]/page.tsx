"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    // Clerk'in SignIn formundaki hata kutusunu (alert-error veya fieldError) dinleyen observer.
    // Eğer SSO işlemi başarısız olur ve "external account not found" (veya Türkçe çevirisi) hatası verirse,
    // Clerk hata mesajı basar. Biz bunu yakalayıp doğrudan "Kayıt Kapalı" (sign-up) rotasına fırlatacağız.
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList" || mutation.type === "characterData") {
          const errorElements = document.querySelectorAll('.cl-alert-error, .cl-formFieldErrorText, .cl-alertText');
          if (errorElements.length > 0) {
            let hasSsoError = false;
            errorElements.forEach(el => {
              const text = el.textContent?.toLowerCase() || "";
              // Clerk'in İngilizce "external account not found" veya Türkçe "bulunamadı", "geçersiz" hatalarını yakala
              // Veya SSO spesifik hatalar.
              if (text.includes("external account") || text.includes("dış hesap") || text.includes("bulunamadı") || text.includes("hesap yok") || text.includes("account not found")) {
                hasSsoError = true;
              }
            });

            if (hasSsoError) {
              console.log("[SignIn] SSO Hata Yakalandı -> Yönlendiriliyor: /sign-up");
              observer.disconnect(); // Loop'a girmemesi için kapat
              router.push("/sign-up");
              return;
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-950">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>
      <div className="relative z-10">
        <SignIn 
          forceRedirectUrl="/dashboard" 
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/sign-up"
          appearance={{ elements: { formButtonPrimary: 'bg-emerald-500 hover:bg-emerald-600 text-sm normal-case' } }} 
        />
      </div>
    </div>
  );
}
