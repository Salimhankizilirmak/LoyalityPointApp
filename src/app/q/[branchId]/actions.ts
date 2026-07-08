"use server";

import { db } from "@/db";
import { qrCustomerRequests, branches } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { headers } from "next/headers";

export async function createQrRequestAction(data: {
  branchId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}) {
  try {
    const branch = await db.select({ orgId: branches.orgId })
      .from(branches)
      .where(eq(branches.id, data.branchId))
      .get();
      
    if (!branch) {
      return { success: false, error: "Geçersiz şube kodu." };
    }

    const reqHeaders = await headers();
    const ipAddress = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "unknown";

    // Sadece son 15 dakika içinde reddedilenleri bul (timer)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentRejected = await db.select()
      .from(qrCustomerRequests)
      .where(and(
         eq(qrCustomerRequests.ipAddress, ipAddress),
         eq(qrCustomerRequests.status, "REJECTED")
      ))
      .orderBy(desc(qrCustomerRequests.createdAt))
      .get();
      
    // Eğer varsa ve 15 dakikadan yeniyse engelle
    if (recentRejected && recentRejected.createdAt > fifteenMinutesAgo) {
       return { success: false, error: "Güvenlik nedeniyle geçici olarak engellendiniz. Lütfen 15 dakika sonra tekrar deneyin." };
    }



    const inserted = await db.insert(qrCustomerRequests).values({
      organizationId: branch.orgId,
      branchId: data.branchId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      status: "PENDING",
      ipAddress: ipAddress,
    }).returning({ id: qrCustomerRequests.id }).get();

    return { success: true, requestId: inserted.id };

  } catch (error) {
    console.error("QR Request Error:", error);
    return { success: false, error: "İşlem sırasında bir hata oluştu." };
  }
}

export async function checkQrRequestStatusAction(requestId: string) {
  try {
    const request = await db.select({
      status: qrCustomerRequests.status,
      clerkTicketUrl: qrCustomerRequests.clerkTicketUrl
    }).from(qrCustomerRequests).where(eq(qrCustomerRequests.id, requestId)).get();

    if (!request) return { success: false, error: "Kayıt bulunamadı." };

    return { success: true, status: request.status, clerkTicketUrl: request.clerkTicketUrl };
  } catch (error) {
    return { success: false, error: "Durum kontrol edilemedi." };
  }
}
