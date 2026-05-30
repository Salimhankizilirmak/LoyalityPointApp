"use client";

import { useState, useEffect } from "react";
import { useClerk, useUser, useOrganization } from "@clerk/nextjs";
import { getAllOrganizations, toggleOrgStatus, getInvitedBosses, revokeBossInvitation } from "@/app/admin/actions";
import { Organization, ActivityLogItem, InvitedBoss } from "../types";
import { MOCK_ORGS, INITIAL_LOGS, ENABLE_MOCK_DATA } from "@/lib/constants/mock-data";

export function useSuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<"organizations" | "bosses">("organizations");
  const [showMockData, setShowMockData] = useState(ENABLE_MOCK_DATA);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [realOrgs, setRealOrgs] = useState<Organization[]>([]);
  const [invitedBosses, setInvitedBosses] = useState<InvitedBoss[]>([]);
  const [logs] = useState<ActivityLogItem[]>(INITIAL_LOGS);
  const [showInvite, setShowInvite] = useState(false);
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [editingQuotaOrg, setEditingQuotaOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignOutOverlay, setShowSignOutOverlay] = useState(false);

  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const { organization } = useOrganization();

  const loadData = async () => {
    try {
      const [orgsData, bossesData] = await Promise.all([
        getAllOrganizations(),
        getInvitedBosses()
      ]);

      interface RawOrg {
        id: string;
        name: string;
        slug: string;
        bossEmail: string;
        branchCount: number;
        branchLimit?: number;
        managerCount: number;
        createdAt: Date | null;
        isActive: boolean;
        customerCount: number;
        totalVolume: number;
      }

      const formatted: Organization[] = (orgsData as RawOrg[]).map(o => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        email: o.bossEmail,
        branches: o.branchCount || 0,
        branchLimit: o.branchLimit || 2,
        managerCount: o.managerCount || 0,
        created: o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : "---",
        status: o.isActive ? "active" : "inactive",
        customers: o.customerCount || 0,
        txVolume: Number(o.totalVolume || 0) / 100 // Kuruş -> TL
      }));
      setRealOrgs(formatted);
      setInvitedBosses(bossesData as InvitedBoss[]);
    } catch (err) {
      console.error("Load data error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const result = await toggleOrgStatus(id, currentStatus);
    if ("success" in result && result.success) {
      loadData();
    }
  };

  const handleRevokeBoss = async (id: string, organizationId?: string) => {
    if (!confirm("Bu daveti iptal etmek istediğinize emin misiniz?")) return;
    const result = await revokeBossInvitation(id, organizationId);
    if ("error" in result) {
      alert(result.error);
    } else {
      loadData();
    }
  };

  // Mock ve gerçek veriyi birleştir
  const orgs = showMockData ? [...MOCK_ORGS, ...realOrgs] : realOrgs;

  const totalCustomers = orgs.reduce((s, o) => s + o.customers, 0);
  const totalVolume = orgs.reduce((s, o) => s + o.txVolume, 0);
  const activeOrgsCount = orgs.filter(o => o.status === "active").length;

  const handleAddOrgMock = (form: { name: string; slug: string; email: string }) => {
    // Mock organizasyon ekleme fonksiyonu (mock-data kullanıldığında simülasyon için)
    const newOrg: Organization = {
      id: `mock-${Date.now()}`,
      name: form.name,
      slug: form.slug,
      email: form.email,
      branches: 0,
      branchLimit: 2,
      managerCount: 0,
      created: new Date().toISOString().split("T")[0],
      status: "active",
      customers: 0,
      txVolume: 0
    };
    setRealOrgs(prev => [newOrg, ...prev]);
  };

  return {
    state: {
      activeTab,
      showMockData,
      isDarkMode,
      realOrgs,
      invitedBosses,
      logs,
      showInvite,
      showAddOrg,
      editingQuotaOrg,
      loading,
      showSignOutOverlay,
      orgs,
      totalCustomers,
      totalVolume,
      activeOrgsCount,
      user,
      organization,
      isLoaded
    },
    actions: {
      setActiveTab,
      setShowMockData,
      setIsDarkMode,
      setShowInvite,
      setShowAddOrg,
      setEditingQuotaOrg,
      setShowSignOutOverlay,
      loadData,
      handleToggle,
      handleRevokeBoss,
      signOut,
      handleAddOrgMock
    }
  };
}
