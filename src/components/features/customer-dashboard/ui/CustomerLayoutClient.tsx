"use client";

import { useState, ReactNode } from "react";


interface CustomerLayoutClientProps {
  children: ReactNode;
  isAuthLoading: boolean;
  userFullName: string | null;
}

export function CustomerLayoutClient({
  children,
}: CustomerLayoutClientProps) {


  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Kullanıcı Adı Kalkanı Banner */}

      
      {/* Ana Gövde */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>


    </div>
  );
}

export default CustomerLayoutClient;
