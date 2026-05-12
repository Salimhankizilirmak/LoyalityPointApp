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
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getCustomers(query?: string) {
  try {
    return await customerService.getCustomers(query);
  } catch {
    return [];
  }
}

export async function updateCustomer(id: string, data: any) {
  try {
    return await customerService.updateCustomer(id, data);
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function deleteCustomer(id: string) {
  try {
    return await customerService.deleteCustomer(id);
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// Re-exporting member management actions
export { getOrgMembers, updateMemberName, removeMember } from "../boss-dashboard/actions";
