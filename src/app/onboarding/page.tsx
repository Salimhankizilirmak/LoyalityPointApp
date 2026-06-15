"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/customer-dashboard");
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="animate-pulse text-sm text-muted-foreground">
        Yönlendiriliyorsunuz...
      </div>
    </div>
  );
}
