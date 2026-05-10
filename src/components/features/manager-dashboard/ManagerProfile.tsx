"use client";

import { motion } from "framer-motion";
import { User, Mail, Shield, MapPin, Calendar } from "lucide-react";
import { useUser } from "@clerk/nextjs";

type UserResource = ReturnType<typeof useUser>["user"];

interface ManagerProfileProps {
  user: UserResource | null | undefined;
  isDarkMode: boolean;
}

export function ManagerProfile({ user, isDarkMode }: ManagerProfileProps) {
  const userRole = (user?.publicMetadata?.role as string) || "manager";
  const roleLabel = userRole === "boss" ? "Patron" : userRole === "manager" ? "Yönetici" : "Kasiyer";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className={`rounded-3xl p-8 border ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100 shadow-sm"}`}>
        <div className="flex flex-col items-center text-center mb-8">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-black mb-4 ${isDarkMode ? "bg-slate-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
            {user?.firstName?.[0] || "Y"}
          </div>
          <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{user?.fullName || "Yönetici"}</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{roleLabel}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
            <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">E-posta</p>
            <p className={`text-sm font-bold truncate ${isDarkMode ? "text-white" : "text-slate-800"}`}>{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
          <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
            <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Şube</p>
            <p className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>İstanbul Cevahir AVM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
