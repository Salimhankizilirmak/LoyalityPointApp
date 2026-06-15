"use client";

import { useState, useEffect, useRef } from "react";
import { useClerk, useUser, useOrganization } from "@clerk/nextjs";
import { getAllOrganizations, toggleOrgStatus, getInvitedBosses, revokeBossInvitation } from "@/app/admin/actions";
import { Organization, ActivityLogItem, InvitedBoss } from "../types";


export function useSuperAdminDashboard(initialOrgsData?: any[], initialBossesData?: any[]) {
  const [activeTab, setActiveTab] = useState<"organizations" | "bosses">("organizations");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [realOrgs, setRealOrgs] = useState<Organization[]>(() => {
    if (initialOrgsData) {
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
      return (initialOrgsData as RawOrg[]).map(o => ({
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
    }
    return [];
  });
  const [invitedBosses, setInvitedBosses] = useState<InvitedBoss[]>(() => initialBossesData || []);
  const [logs] = useState<ActivityLogItem[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [editingQuotaOrg, setEditingQuotaOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(!initialOrgsData);
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

  const hasInitialData = !!(initialOrgsData && initialBossesData);
  const isFirstMount = useRef(true);

  useEffect(() => {
    const t = setTimeout(() => {
      if (hasInitialData && isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }
      loadData();
    }, 0);
    return () => clearTimeout(t);
  }, [hasInitialData]);

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

  const orgs = realOrgs;

  const totalCustomers = orgs.reduce((s, o) => s + o.customers, 0);
  const totalVolume = orgs.reduce((s, o) => s + o.txVolume, 0);
  const activeOrgsCount = orgs.filter(o => o.status === "active").length;



  return {
    state: {
      activeTab,
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
      setIsDarkMode,
      setShowInvite,
      setShowAddOrg,
      setEditingQuotaOrg,
      setShowSignOutOverlay,
      loadData,
      handleToggle,
      handleRevokeBoss,
      signOut
    }
  };
}
