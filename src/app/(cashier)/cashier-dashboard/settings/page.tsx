import { ProfileSettingsPage } from "@/components/features/profile-settings/ui/ProfileSettingsPage";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default function CashierSettingsPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 sm:p-8">
      <div className="max-w-4xl mx-auto mb-6">
        <Link 
          href="/cashier-dashboard" 
          className="inline-flex items-center gap-2 text-[10px] font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Panele Geri Dön</span>
        </Link>
      </div>
      <ProfileSettingsPage />
    </div>
  );
}
