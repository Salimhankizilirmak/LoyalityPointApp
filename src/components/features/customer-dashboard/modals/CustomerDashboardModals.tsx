"use client";

interface CustomerDashboardModalsProps {
  state: {
    showSignOutOverlay: boolean;
  };
  actions: {
    signOut: (options?: { redirectUrl?: string }) => Promise<void>;
  };
}

export function CustomerDashboardModals({ state, actions }: CustomerDashboardModalsProps) {
  return null;
}
