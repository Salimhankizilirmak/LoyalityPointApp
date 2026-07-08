"use client";

import { ReactNode } from "react";
import { BranchSelector } from "@/components/ui/BranchSelector";
import { type BranchOption } from "@/lib/branch-context";
import { usePathname, useRouter } from "next/navigation";
import { Store, PieChart, UserPlus, Users } from "lucide-react";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { useUser } from "@clerk/nextjs";
import { UniversalSidebar } from "@/components/ui/UniversalSidebar";

interface BossLayoutClientProps {
  children: ReactNode;
  isMultiBranch?: boolean;
  activeBranchId?: string | null;
  allBranches?: BranchOption[];
  registrationCode?: string | null;
}

export function BossLayoutClient({
  children,
  isMultiBranch,
  activeBranchId,
  allBranches,
}: BossLayoutClientProps) {
  const router = useRouter();
  const { user } = useUser();

  useKeyboardShortcut('F5', () => {
    router.refresh();
  }, { preventDefault: true });

  const navItems = [
    { name: "Şubeler", href: "/boss-dashboard/branches", icon: Store },
    { name: "Analiz", href: "/boss-dashboard/analytics", icon: PieChart },
    { name: "Ekibim", href: "/boss-dashboard/team", icon: Users },
    { name: "Yönetici Davet", href: "/boss-dashboard/invite-manager", icon: UserPlus },
  ];

  const userFullName = user?.fullName || "Patron";

  const handleEditProfile = async (newName: string) => {
    if (!user) return;
    if (newName && newName.trim() !== "" && newName !== userFullName) {
      try {
        const parts = newName.trim().split(" ");
        const firstName = parts[0];
        const lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined;
        await user.update({
          firstName,
          ...(lastName !== undefined && { lastName })
        });
      } catch (error) {
        console.error("İsim güncellenirken hata:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-indigo-500/30">
      
      {/* Sidebar */}
      <UniversalSidebar 
         title={userFullName}
         subtitle="Patron"
         navItems={navItems}
         onEditProfile={handleEditProfile}
      />

      {/* İçerik */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative pt-16 md:pt-0 h-screen overflow-y-auto">
        
        {/* Tepe barında Şube Seçici (Sadece patronun çoklu şubesi varsa) */}
        {isMultiBranch && activeBranchId && allBranches && (
          <div className="p-4 border-b border-white/5 bg-slate-900/50 flex justify-end sticky top-0 z-50 backdrop-blur-md">
            <div className="w-64">
              <BranchSelector activeBranchId={activeBranchId} branches={allBranches} />
            </div>
          </div>
        )}

        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>

    </div>
  );
}
