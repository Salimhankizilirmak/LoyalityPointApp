"use client";

import { useState, ReactNode } from "react";
import { BranchSelector } from "@/components/ui/BranchSelector";
import { type BranchOption } from "@/lib/branch-context";
import { UniversalSidebar } from "@/components/ui/UniversalSidebar";
import { useUser } from "@clerk/nextjs";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X } from "lucide-react";

interface ManagerLayoutClientProps {
  children: ReactNode;
  isMultiBranch?: boolean;
  activeBranchId?: string | null;
  allBranches?: BranchOption[];
  registrationCode?: string | null;
}

export function ManagerLayoutClient({
  children,
  isMultiBranch,
  activeBranchId,
  allBranches,
  registrationCode,
}: ManagerLayoutClientProps) {
  const { user } = useUser();
  const router = useRouter();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  useKeyboardShortcut('F5', () => {
    router.refresh();
  }, { preventDefault: true });

  const managerName = user 
    ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.emailAddresses[0]?.emailAddress?.split("@")[0] || "Yönetici")
    : "Yönetici";
    
  const branchName = user?.publicMetadata?.branchName as string || "Organizasyon";


  const navItems = [
    { name: "Genel Bakış", href: "/manager-dashboard", icon: require("lucide-react").LayoutDashboard },
    { name: "Ekibim", href: "/manager-dashboard/team", icon: require("lucide-react").Briefcase },
    { name: "Kampanyalar", href: "/manager-dashboard/campaigns", icon: require("lucide-react").Megaphone },
    { name: "Mağaza Yönetimi", href: "/manager-dashboard/store-management", icon: require("lucide-react").Settings },
  ];

  return (
    <div className="relative flex min-h-screen bg-slate-950 text-slate-100 w-full">
      <UniversalSidebar title={managerName} subtitle={branchName} navItems={navItems} showOrganizationSwitcher={false} />

      {/* Sağ İçerik Alanı */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="absolute top-3 right-4 z-50 flex items-center gap-3">
          {registrationCode && (
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl hover:bg-indigo-500/30 transition-colors font-bold text-xs"
            >
              <QrCode size={16} />
              <span className="hidden sm:inline">Kayıt QR</span>
            </button>
          )}
          {isMultiBranch && activeBranchId && allBranches && (
            <BranchSelector
              activeBranchId={activeBranchId}
              branches={allBranches}
            />
          )}
        </div>

        {children}
      </div>

      {/* QR Modal */}
      {isQrModalOpen && registrationCode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-white mb-2">Müşteri Kayıt QR</h2>
            <p className="text-sm text-slate-400 mb-6">Müşterileriniz bu QR kodu okutarak kayıt talebi oluşturabilir.</p>
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto mb-6">
              <QRCodeSVG
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/register/${registrationCode}`}
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"H"}
              />
            </div>
            <div className="text-xs text-slate-500 break-all bg-slate-950 p-3 rounded-lg border border-white/5">
              {`${typeof window !== "undefined" ? window.location.origin : ""}/register/${registrationCode}`}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
