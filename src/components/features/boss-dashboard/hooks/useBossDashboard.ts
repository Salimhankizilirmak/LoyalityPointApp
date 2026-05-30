"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import {
  getBossProfile,
  updateOrgSettings,
  createBranch as createBranchAction,
  getOrgMembers,
  updateMemberName,
  removeMember,
  deleteBranch,
  getBranches,
  toggleBranchStatus,
  setActiveOrganization,
  reassignManager
} from "@/app/(boss)/boss-dashboard/actions";
import { Branch, Employee, BossInfo } from "../types";
import { Customer } from "@/components/features/manager-dashboard/types";
import { MOCK_BRANCHES, MOCK_CUSTOMERS, ENABLE_MOCK_DATA } from "@/lib/constants/mock-data";

interface UseBossDashboardProps {
  setIsDeleting: (loading: boolean) => void;
  setDeleteType: (type: "branch" | "staff") => void;
  setIsTogglingStatus: (loading: boolean) => void;
  setToggleAction: (action: "activate" | "deactivate" | null) => void;
  setShowAddBranch: (show: boolean) => void;
}

export function useBossDashboard({
  setIsDeleting,
  setDeleteType,
  setIsTogglingStatus,
  setToggleAction,
  setShowAddBranch
}: UseBossDashboardProps) {
  const [showMockData, setShowMockData] = useState(ENABLE_MOCK_DATA);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Real Data State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bossInfo, setBossInfo] = useState<BossInfo | null>(null);
  const [allOrgs, setAllOrgs] = useState<{ id: string; name: string }[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string>("");

  // Settings State
  const [pointRate, setPointRate] = useState(10);
  const [validityMonths, setValidityMonths] = useState(12);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Loading and Error States
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUser();

  const refreshData = useCallback(async () => {
    try {
      const [profile, emps, dbBranches] = await Promise.all([
        getBossProfile(),
        getOrgMembers(),
        getBranches()
      ]);

      setBossInfo({
        name: `${profile.user.firstName || ""} ${profile.user.lastName || ""}`.trim(),
        email: profile.user.email,
        orgName: profile.org?.name || "Yükleniyor...",
        branchLimit: profile.org?.branchLimit || 2,
        currentBranches: profile.org?.currentBranches || 0,
        username: profile.user.username || null,
      });

      setAllOrgs(profile.allOrgs || []);
      setActiveOrgId(profile.org?.id || "");

      if (profile.org) {
        setPointRate(profile.org.pointRate);
        setValidityMonths(profile.org.validityMonths);
      }

      setEmployees(emps as Employee[]);

      const mappedBranches: Branch[] = dbBranches.map(b => ({
        id: b.id,
        name: b.name,
        city: b.city || "Atanmadı",
        manager: "Atanmadı",
        transactions: 0,
        earnedPts: 0,
        spentPts: 0,
        status: b.isActive ? "active" : "passive"
      }));
      setBranches(mappedBranches);
    } catch (err) {
      console.error("Data fetch error:", err);
      setError("Veriler yüklenirken bir hata oluştu.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      if (user && active) {
        await refreshData();
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, [user, refreshData]);

  // Filters & Calculations
  const managers = employees.filter(e => e.role === "manager");
  const realBranchesCount = branches.length;
  const isQuotaLimitReached = bossInfo ? realBranchesCount >= (bossInfo.branchLimit || 2) : false;
  const hasNoUsername = !bossInfo?.username || bossInfo.username.trim() === "";

  const displayBranches = showMockData ? [...MOCK_BRANCHES, ...branches] : branches;
  const displayEmployees = employees;
  const displayCustomers = showMockData ? [...MOCK_CUSTOMERS, ...customers] : customers;

  const totalEarned = displayBranches.reduce((s, b) => s + b.earnedPts, 0);
  const totalSpent = displayBranches.reduce((s, b) => s + b.spentPts, 0);
  const activeBranchesCount = displayBranches.filter(b => b.status === "active").length;

  // Actions
  const handleReassignMember = async (memberId: string, branchName: string, orgId: string) => {
    try {
      await reassignManager(memberId, branchName, orgId);
      await refreshData();
    } catch (err) {
      console.error(err);
      setError("Şube değiştirilemedi.");
    }
  };

  const handleSelectOrg = async (orgId: string) => {
    try {
      await setActiveOrganization(orgId);
      await refreshData();
    } catch (err) {
      console.error(err);
      setError("Organizasyon değiştirilemedi.");
    }
  };

  const handleUpdateMember = async (id: string, fName: string, lName: string) => {
    setLoadingId(id);
    try {
      await updateMemberName(id, fName, lName);
      await refreshData();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : null) || "Güncelleme sırasında hata oluştu.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemoveMember = async (id: string) => {
    setDeleteType("staff");
    setIsDeleting(true);
    try {
      await removeMember(id);
      await refreshData();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : null) || "Çalışan silinemedi.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    setDeleteType("branch");
    setIsDeleting(true);
    try {
      await deleteBranch(id);
      await refreshData();
    } catch (err) {
      console.error(err);
      setError("Şube silinemedi.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleBranchStatus = async (id: string) => {
    const branch = branches.find(b => b.id === id);
    if (!branch) return;

    const action = branch.status === "active" ? "deactivate" : "activate";
    setToggleAction(action);
    setIsTogglingStatus(true);

    try {
      await toggleBranchStatus(id);
      await refreshData();
    } catch (err) {
      console.error(err);
      setError("Durum güncellenemedi.");
    } finally {
      setIsTogglingStatus(false);
      setToggleAction(null);
    }
  };

  const handleCreateBranch = async (data: { name: string; city: string }) => {
    try {
      await createBranchAction(data.name, data.city);
      await refreshData();
      setShowAddBranch(false);
    } catch (err) {
      console.error(err);
      setError("Şube oluşturulurken bir hata oluştu.");
    }
  };

  const handleChangeManager = async (branchId: number | string, managerId: string) => {
    const managerName = managers.find(m => m.id === managerId)?.name || "Atanmadı";
    setBranches(prev => prev.map(b => b.id === branchId ? { ...b, manager: managerName } : b));
  };

  const handleSaveSettings = async (rate: number, validity: number) => {
    setSavingSettings(true);
    try {
      await updateOrgSettings(rate, validity);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (err) {
      console.error(err);
      setError("Ayarlar kaydedilirken hata oluştu.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddCustomer = async (data: { firstName: string; lastName: string; phone: string }) => {
    const newCust: Customer = {
      id: `c-${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: "",
      currentPoints: 100
    };
    setCustomers(prev => [newCust, ...prev]);
  };

  return {
    showMockData,
    setShowMockData,
    isDarkMode,
    setIsDarkMode,
    activeTab,
    setActiveTab,
    displayBranches,
    displayEmployees,
    displayCustomers,
    bossInfo,
    allOrgs,
    activeOrgId,
    pointRate,
    validityMonths,
    savingSettings,
    settingsSaved,
    loadingId,
    error,
    setError,
    managers,
    realBranchesCount,
    isQuotaLimitReached,
    hasNoUsername,
    totalEarned,
    totalSpent,
    activeBranchesCount,
    refreshData,
    handleReassignMember,
    handleSelectOrg,
    handleUpdateMember,
    handleRemoveMember,
    handleDeleteBranch,
    handleToggleBranchStatus,
    handleCreateBranch,
    handleChangeManager,
    handleSaveSettings,
    handleAddCustomer
  };
}
