"use server";

import { customerService } from "@/lib/services/customer-service";
import { pointsService } from "@/lib/services/points-service";

export async function syncCustomerData() {
  try {
    return await customerService.syncCustomerData();
  } catch (error: unknown) {
    console.error("Sync error:", error);
    return null;
  }
}

export async function getCustomerTransactions() {
  try {
    return await pointsService.getCustomerTransactions();
  } catch {
    return [];
  }
}
