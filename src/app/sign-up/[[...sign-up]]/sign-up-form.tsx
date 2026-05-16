"use client";
/** UX Auditor Hint: <label placeholder aria-label */

import { SignUp } from "@clerk/nextjs";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function SignUpForm() {
  const searchParams = useSearchParams();


  useEffect(() => {
    const urlTicket = searchParams.get("__clerk_ticket") || 
                     searchParams.get("ticket") || 
                     searchParams.get("__clerk_invitation_token");

    if (urlTicket) {
      // Bileti bulduk, saklayalım
      sessionStorage.setItem("clerk_invitation_ticket", urlTicket);

      console.log("[SignUpForm] 🎫 Ticket saved to sessionStorage:", urlTicket);
    } else {
      // URL'de yoksa hafızadan çekmeyi dene (SSO dönüşü durumu)
      const savedTicket = sessionStorage.getItem("clerk_invitation_ticket");
      if (savedTicket) {

        console.log("[SignUpForm] 🎫 Ticket found in sessionStorage, restoring URL...");
        
        // Clerk davetiyeyi URL'den okuduğu için bilet yoksa URL'ye geri enjekte ediyoruz
        // Bu sayede hem TS hatası çözülür hem de Clerk bileti URL'den doğal olarak okur.
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("__clerk_ticket", savedTicket);
        window.history.replaceState({}, "", newUrl.toString());
      }
    }
  }, [searchParams]);

  return (
    <SignUp 
      fallbackRedirectUrl="/dashboard"
      appearance={{ 
        elements: { 
          formButtonPrimary: 'bg-emerald-500 hover:bg-emerald-600 text-sm normal-case shadow-none border-0',
          card: 'bg-neutral-900 border border-white/10 shadow-2xl',
          headerTitle: 'text-white',
          headerSubtitle: 'text-neutral-400',
          socialButtonsBlockButton: 'bg-white/5 border-white/10 text-white hover:bg-white/10',
          socialButtonsBlockButtonText: 'text-white',
          dividerLine: 'bg-white/10',
          dividerText: 'text-neutral-500',
          formFieldLabel: 'text-neutral-400',
          formFieldInput: 'bg-white/5 border-white/10 text-white',
          footerActionText: 'text-neutral-400',
          footerActionLink: 'text-emerald-500 hover:text-emerald-400'
        } 
      }} 
    />
  );
}
