"use client";

import { AnimatePresence } from "framer-motion";
import { SignOutOverlay } from "@/components/dashboard/SignOutOverlay";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  return (
    <AnimatePresence mode="wait">
      {showSignOutOverlay && (
        <SignOutOverlay
          onCountdownComplete={async () => {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("signing_out", "true");
            }
            await signOut({ redirectUrl: "/" });
          }}
        />
      )}
    </AnimatePresence>
  );
}
