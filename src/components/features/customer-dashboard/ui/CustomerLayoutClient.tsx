"use client";

import { useState, ReactNode } from "react";
import { useOrganization, useClerk, useAuth } from "@clerk/nextjs";
import { DashboardLoadingScreen } from "@/components/dashboard/DashboardLoadingScreen";
import UsernameWarningBanner from "@/components/ui/UsernameWarningBanner";
import { ProfileSettingsModal } from "@/components/features/profile-settings/ui/ProfileSettingsModal";

interface CustomerLayoutClientProps {
  children: ReactNode;
  username?: string | null;
  isAuthLoading: boolean;
  userFullName: string | null;
}

export function CustomerLayoutClient({
  children,
  username,
  isAuthLoading,
  userFullName,
}: CustomerLayoutClientProps) {
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const { organization } = useOrganization();
  const { signOut } = useClerk();
  const { isLoaded } = useAuth();

  // 1. GİRİŞ YÜKLEME BARİKATI
  if (isAuthLoading) {
    return (
      <DashboardLoadingScreen
        userName={userFullName}
        orgName={organization?.name || "Sadakat Paneli"}
        logoUrl={organization?.imageUrl || null}
      />
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Kullanıcı Adı Kalkanı Banner */}
      <UsernameWarningBanner
        username={username}
        onActionClick={() => setShowProfileSettings(true)}
      />
      
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
