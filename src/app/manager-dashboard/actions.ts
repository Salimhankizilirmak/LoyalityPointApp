"use server";

import { pointsService } from "@/lib/services/points-service";
import { customerService } from "@/lib/services/customer-service";

export async function getBranchTransactions() {
  try {
    return await pointsService.getBranchTransactions();
  } catch {
    return [];
  }
}

export async function manualAdjustmentAction(customerId: string, amountKurusStr: string) {
  const amountKurus = parseInt(amountKurusStr, 10);
  if (isNaN(amountKurus) || amountKurus === 0) return { error: "Geçerli bir tutar giriniz." };

  try {
    return await pointsService.manualAdjustment(customerId, amountKurus);
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Bilinmeyen hata") };
  }
}

export async function getCustomers(query?: string) {
  try {
    return await customerService.getCustomers(query);
  } catch {
    return [];
  }
}

export async function updateCustomer(id: string, data: Record<string, unknown>) {
  try {
    return await customerService.updateCustomer(id, data);
  } catch (error: unknown) {
    throw new Error((error instanceof Error ? error.message : "Bilinmeyen hata"));
  }
}

export async function deleteCustomer(id: string) {
  try {
    return await customerService.deleteCustomer(id);
  } catch (error: unknown) {
    throw new Error((error instanceof Error ? error.message : "Bilinmeyen hata"));
  }
}

import { managerService } from "@/lib/services/manager-service";

export async function getManagerProfile() {
  return await managerService.getMyBranchData();
}

import { 
  getOrgMembers as getOrgMembersAction, 
  updateMemberName as updateMemberNameAction, 
  removeMember as removeMemberAction 
} from "../boss-dashboard/actions";

export async function getOrgMembers() {
  return await getOrgMembersAction();
}

export async function updateMemberName(id: string, firstName: string, lastName: string) {
  return await updateMemberNameAction(id, firstName, lastName);
}

export async function removeMember(id: string) {
  return await removeMemberAction(id);
}
