"use client";

import { useState, ReactNode } from "react";
import { BranchSelector } from "@/components/ui/BranchSelector";
import { type BranchOption } from "@/lib/branch-context";
import { UniversalSidebar } from "@/components/ui/UniversalSidebar";
import { useUser } from "@clerk/nextjs";

interface ManagerLayoutClientProps {
  children: ReactNode;
  isMultiBranch?: boolean;
  activeBranchId?: string | null;
  allBranches?: BranchOption[];
}

export function ManagerLayoutClient({
  children,
  isMultiBranch,
  activeBranchId,
  allBranches,
}: ManagerLayoutClientProps) {
  const { user } = useUser();

  const managerName = user 
    ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.emailAddresses[0]?.emailAddress?.split("@")[0] || "Yönetici")
    : "Yönetici";
    
  const branchName = user?.publicMetadata?.branchName as string || "Organizasyon";


  const navItems = [
    { name: "Genel Bakış", href: "/manager-dashboard", icon: require("lucide-react").LayoutDashboard },
    { name: "Müşteriler", href: "/manager-dashboard/customers", icon: require("lucide-react").Users },
    { name: "Ekibim", href: "/manager-dashboard/team", icon: require("lucide-react").Briefcase },
    { name: "Kampanyalar", href: "/manager-dashboard/campaigns", icon: require("lucide-react").Megaphone },
  ];

  return (
    <div className="relative flex min-h-screen bg-slate-950 text-slate-100 w-full">
      <UniversalSidebar title={managerName} subtitle={branchName} navItems={navItems} showOrganizationSwitcher={false} />

      {/* Sağ İçerik Alanı */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {isMultiBranch && activeBranchId && allBranches && (
          <div className="absolute top-3 right-4 z-50">
            <BranchSelector
              activeBranchId={activeBranchId}
              branches={allBranches}
            />
          </div>
        )}

        {children}
      </div>

    </div>
  );
}
