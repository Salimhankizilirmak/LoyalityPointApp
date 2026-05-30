"use client";

import { AnimatePresence } from "framer-motion";
import { SignOutOverlay } from "@/components/dashboard/SignOutOverlay";

interface CustomerDashboardModalsProps {
  state: {
    showSignOutOverlay: boolean;
  };
  actions: {
    signOut: (options?: { redirectUrl?: string }) => Promise<void>;
  };
}

export function CustomerDashboardModals({ state, actions }: CustomerDashboardModalsProps) {
  const { showSignOutOverlay } = state;
  const { signOut } = actions;

  return (
    <AnimatePresence mode="wait">
      {showSignOutOverlay && (
        <SignOutOverlay
          onCountdownComplete={() => signOut({ redirectUrl: "/" })}
        />
      )}
    </AnimatePresence>
  );
}
