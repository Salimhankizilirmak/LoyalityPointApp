"use client";

import { useState, ReactNode } from "react";
import { ProfileSettingsModal } from "@/components/features/profile-settings/ui/ProfileSettingsModal";

interface CustomerLayoutClientProps {
  children: ReactNode;
  isAuthLoading: boolean;
  userFullName: string | null;
}

export function CustomerLayoutClient({
  children,
}: CustomerLayoutClientProps) {
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Kullanıcı Adı Kalkanı Banner */}

      
      {/* Ana Gövde */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>

      <ProfileSettingsModal
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
        isDarkMode={true}
      />
    </div>
  );
}

export default CustomerLayoutClient;
