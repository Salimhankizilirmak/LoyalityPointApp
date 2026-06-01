"use client";

import { useState, ReactNode } from "react";
import UsernameWarningBanner from "@/components/ui/UsernameWarningBanner";
import { UsernameWarningModal } from "@/components/ui/UsernameWarningModal";
import { saveCustomerUsernameAction } from "./actions";

interface CustomerLayoutClientProps {
  children: ReactNode;
  username?: string | null;
}

export function CustomerLayoutClient({
  children,
  username,
}: CustomerLayoutClientProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);

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
