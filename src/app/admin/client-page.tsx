"use client";

import { Plus } from "lucide-react";
import { useSuperAdminDashboard } from "@/components/features/super-admin/hooks/useSuperAdminDashboard";
import { DashboardHeader } from "@/components/features/super-admin/ui/DashboardHeader";

import { SuperAdminModals } from "@/components/features/super-admin/modals/SuperAdminModals";
import { OrganizationsSection, InvitedBossesSection } from "@/components/features/super-admin/sections";

interface SuperAdminDashboardClientProps {
  initialOrgsData: any[];
  initialBossesData: any[];
}

export function SuperAdminDashboardClient({
  initialOrgsData,
  initialBossesData
}: SuperAdminDashboardClientProps) {
  const { state, actions } = useSuperAdminDashboard(initialOrgsData, initialBossesData);
  const { activeTab, isDarkMode, loading, user, organization, isLoaded } = state;
  const { setActiveTab, setShowInvite, signOut } = actions;

  const hasInitialData = !!initialOrgsData;



  return (
    <div className={`min-h-screen w-full transition-colors duration-500 font-sans ${isDarkMode ? "bg-[#0a0a0f] text-white" : "bg-slate-50 text-slate-900"}`}>
      <SuperAdminModals state={state} actions={actions} />

      <DashboardHeader
        user={user}
        isDarkMode={isDarkMode}
        setIsDarkMode={actions.setIsDarkMode}
        signOut={() => signOut({ redirectUrl: "/" })}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>

            <h1 className="text-2xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              {activeTab === "organizations" ? "Organizasyon Yönetimi" : "Patron Yönetimi"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {activeTab === "organizations"
                ? "İşletmelerin durumlarını ve şubelerini yönetin"
                : "Davet edilen patronları ve durumlarını yönetin"}
            </p>
          </div>
          {activeTab === "bosses" && (
            <button onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold self-start sm:self-auto transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#ffffff", boxShadow: "0 4px 20px rgba(99,102,241,0.25)" }}>
              <Plus size={15} />Patron Davet Et
            </button>
          )}
        </div>

        {activeTab === "organizations" ? (
          <OrganizationsSection state={state} actions={actions} />
        ) : (
          <InvitedBossesSection state={state} actions={actions} />
        )}
      </div>
    </div>
  );
}
