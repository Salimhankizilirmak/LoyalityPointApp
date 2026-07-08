"use server";

import { db } from "@/db";
import { qrCustomerRequests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { checkLayoutGuard } from "@/lib/layout-guard";

export async function getPendingApprovalsCountAction(branchId: string) {
  try {
    const dbUser = await checkLayoutGuard();
    if (!dbUser || !branchId) return { success: false, count: 0 };

    const requests = await db.select({ id: qrCustomerRequests.id })
      .from(qrCustomerRequests)
      .where(and(
        eq(qrCustomerRequests.branchId, branchId),
        eq(qrCustomerRequests.status, "PENDING")
      ))
      .all();
      
    return { success: true, count: requests.length };
  } catch (error) {
    return { success: false, count: 0 };
  }
}

export async function getPendingRequestsAction(branchId: string) {
  try {
    const dbUser = await checkLayoutGuard();
    if (!dbUser || !branchId) return { success: false, data: [] };

    const requests = await db.select()
      .from(qrCustomerRequests)
      .where(and(
        eq(qrCustomerRequests.branchId, branchId),
        eq(qrCustomerRequests.status, "PENDING")
      ))
      .all();
      
    const formattedRequests = requests.map(req => ({
      id: req.id,
      name: `${req.firstName} ${req.lastName}`,
      email: req.email,
      phone: req.phoneNumber,
      createdAt: Math.floor(req.createdAt.getTime() / 1000)
    }));

    return { success: true, data: formattedRequests };
  } catch (error) {
    return { success: false, data: [] };
  }
}


