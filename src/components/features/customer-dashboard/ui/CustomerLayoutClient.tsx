"use client";

import { useState, ReactNode } from "react";
import { useOrganization, useClerk } from "@clerk/nextjs";
import { DashboardLoadingScreen } from "@/components/dashboard/DashboardLoadingScreen";
import { SignOutOverlay } from "@/components/dashboard/SignOutOverlay";
import UsernameWarningBanner from "@/components/ui/UsernameWarningBanner";
import { UsernameWarningModal } from "@/components/ui/UsernameWarningModal";
import { saveCustomerUsernameAction } from "@/app/(customer)/customer-dashboard/actions";

interface CustomerLayoutClientProps {
  children: ReactNode;
  username?: string | null;
  isAuthLoading: boolean;
  showSignOutOverlay: boolean;
  userFullName: string | null;
}

export function CustomerLayoutClient({
  children,
  username,
  isAuthLoading,
  showSignOutOverlay,
  userFullName,
}: CustomerLayoutClientProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { organization } = useOrganization();
  const { signOut } = useClerk();

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

  // 2. ÇIKIŞ GÜVENLİK BARİKATI
  if (showSignOutOverlay) {
    return (
      <SignOutOverlay
        onCountdownComplete={() => signOut({ redirectUrl: "/" })}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Kullanıcı Adı Kalkanı Banner */}
      <UsernameWarningBanner
        username={username}
        onActionClick={() => setShowProfileModal(true)}
      />
      
      {/* Ana Gövde */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>

      {/* Kullanıcı Adı Kalkanı Modal */}
      <UsernameWarningModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        saveAction={saveCustomerUsernameAction}
      />
    </div>
  );
}

export default CustomerLayoutClient;
