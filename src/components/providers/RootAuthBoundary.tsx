"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface RootAuthBoundaryProps {
  children: ReactNode;
}

export default function RootAuthBoundary({ children }: RootAuthBoundaryProps) {
  const { isLoaded, userId } = useAuth();
  const pathname = usePathname();

  // Korumalı alanlarda (-dashboard veya /admin yollarında) oturum sonlandırıldığında,
  // Next.js'in asenkron loading çağrılarını ve shimmer parlamalarını önlemek için short-circuit uygula.
  const isProtectedRoute = pathname.includes("-dashboard") || pathname.includes("/admin");

  if (isProtectedRoute && isLoaded && !userId) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  return <>{children}</>;
}
