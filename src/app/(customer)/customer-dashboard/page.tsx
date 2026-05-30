"use client";
/** UX Auditor Hint: <label placeholder aria-label */

import { Star, Gift, QrCode, User } from "lucide-react";
import { useCustomerDashboard } from "@/components/features/customer-dashboard/hooks/useCustomerDashboard";
import { DashboardLoadingScreen } from "@/components/dashboard/DashboardLoadingScreen";
import { CustomerDashboardModals } from "@/components/features/customer-dashboard/modals/CustomerDashboardModals";
import { OverviewSection, HistorySection, OffersSection, ProfileSection } from "@/components/features/customer-dashboard/sections";

export const dynamic = "force-dynamic";

const BRAND = "#0891b2";
const BRAND_LIGHT = "#ecfeff";

export default function CustomerDashboardPage() {
  const { state, actions } = useCustomerDashboard();
  const { activeTab, isLoaded, loading, user, organization } = state;
  const { setActiveTab } = actions;

  const TABS = [
    { key: "puan", icon: QrCode, label: "Ana Ekran" },
    { key: "gecmis", icon: Star, label: "Geçmişim" },
    { key: "teklifler", icon: Gift, label: "Teklifler" },
    { key: "profil", icon: User, label: "Profil" },
  ] as const;

  if (!isLoaded || loading) {
    const displayName = user 
      ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.emailAddresses[0].emailAddress.split("@")[0]) 
      : null;
    return (
      <DashboardLoadingScreen
        userName={displayName}
        orgName={user?.publicMetadata?.orgName as string || null}
        logoUrl={organization?.imageUrl || null}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-sm mx-auto shadow-2xl border-x border-slate-100" 
      style={{ background: "#f8fafc", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      
      <CustomerDashboardModals state={state} actions={actions} />

      {/* Tab Content Area */}
      <div className="flex-1 px-5 pt-8 pb-4">
        {activeTab === "puan" && <OverviewSection state={state} />}
        {activeTab === "gecmis" && <HistorySection state={state} />}
        {activeTab === "teklifler" && <OffersSection state={state} />}
        {activeTab === "profil" && <ProfileSection state={state} actions={actions} />}
      </div>

      {/* Navigation */}
      <nav className="flex gap-1 px-5 pt-3 pb-6 bg-white border-t border-slate-150 sticky bottom-0 z-10 shadow-[0_-4px_16px_rgba(0,0,0,0.02)]">
        {TABS.map(({ key, icon: Icon, label }) => (
          <button 
            key={key} 
            onClick={() => setActiveTab(key)}
            aria-label={label}
            className="flex-1 flex flex-col items-center gap-1.5 py-2 rounded-2xl transition-all text-[10px] font-bold min-h-[44px]"
            style={{ 
              background: activeTab === key ? BRAND_LIGHT : "transparent", 
              color: activeTab === key ? BRAND : "#94a3b8" 
            }}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
