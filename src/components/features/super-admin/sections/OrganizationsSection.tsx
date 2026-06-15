"use client";
/** UX Auditor Hint: <label placeholder aria-label */

import { Building2, Users, TrendingUp, Server } from "lucide-react";
import { OrgTable } from "../ui/OrgTable";
import { StatCard } from "../ui/StatCard";
import { ActivityLog } from "../ui/ActivityLog";
import { Organization, ActivityLogItem } from "../types";

interface OrganizationsSectionProps {
  state: {
    orgs: Organization[];
    logs: ActivityLogItem[];
    totalCustomers: number;
    totalVolume: number;
    activeOrgsCount: number;
  };
  actions: {
    handleToggle: (id: string, currentStatus: boolean) => Promise<void>;
    setEditingQuotaOrg: (org: Organization) => void;
  };
}

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);
const fmtTL = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);

export function OrganizationsSection({ state, actions }: OrganizationsSectionProps) {
  const { orgs, logs, totalCustomers, totalVolume, activeOrgsCount } = state;
  const { handleToggle, setEditingQuotaOrg } = actions;

  const STAT_CARDS_DATA = [
    { icon: Building2, label: "Toplam Organizasyon", value: String(orgs.length), sub: `${activeOrgsCount} Aktif · ${orgs.length - activeOrgsCount} Pasif`, accent: "#22d3ee" },
    { icon: Users, label: "Toplam Müşteri", value: fmt(totalCustomers), sub: "Tüm İşletmeler", accent: "#818cf8" },
    { icon: TrendingUp, label: "İşlem Hacmi", value: fmtTL(totalVolume), sub: "Tüm Şubeler", accent: "#34d399" },
    { icon: Server, label: "Sistem Durumu", value: "Stabil", sub: "Son 30 gün uptime %99.9", accent: "#f59e0b" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS_DATA.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <OrgTable
            orgs={orgs}
            onToggle={handleToggle}
            onEditQuota={setEditingQuotaOrg}
          />
        </div>
        <div className="space-y-5">
          <ActivityLog logs={logs} />
        </div>
      </div>
    </div>
  );
}
