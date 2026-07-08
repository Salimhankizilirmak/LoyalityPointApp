import os

file_path = "src/app/(cashier)/cashier-dashboard/approvals/actions.ts"

code = """\
"use server";

import { db } from "@/db";
import { qrCustomerRequests, customers, activityLogs, organizations, branches } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClerkClient } from "@clerk/backend";
import { checkLayoutGuard } from "@/lib/layout-guard";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { getCustomerInvitationTemplate } from "@/lib/templates/email-templates";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

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

export async function handleApprovalAction(requestId: string, action: "APPROVE" | "REJECT") {
  try {
    const dbUser = await checkLayoutGuard();
    if (dbUser.role !== "CASHIER" && dbUser.role !== "MANAGER" && dbUser.role !== "BOSS") {
      throw new Error("Yetkisiz işlem.");
    }

    const request = await db.select().from(qrCustomerRequests).where(eq(qrCustomerRequests.id, requestId)).get();
    if (!request) return { error: "Kayıt talebi bulunamadı." };
    if (request.status !== "PENDING") return { error: "Bu talep zaten işlenmiş." };

    const now = new Date();

    if (action === "APPROVE") {
      // Müşterinin organizasyon ve şube bilgisini alalım (mail içeriği için)
      const org = await db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, request.organizationId)).get();
      const branch = await db.select({ name: branches.name }).from(branches).where(eq(branches.id, request.branchId)).get();
      const orgName = org?.name || "İşletme";
      const branchName = branch?.name || "Şube";

      let invitationUrl = "";

      // Clerk Invitation oluştur
      try {
        const inviteParams: any = { 
          emailAddress: request.email, 
          publicMetadata: { role: "customer", orgId: request.organizationId },
          ignoreDefaultEmail: true,
          notify: false 
        };
        const clerkInv = await clerkClient.invitations.createInvitation(inviteParams);
        invitationUrl = clerkInv.url;
      } catch (clerkErr) {
        console.error("Clerk daveti oluşturulurken hata:", clerkErr);
        // Hata olsa bile db kaydını yapalım veya işlemi durduralım. 
        // Şimdilik kritikse işlemi durduralım.
        return { error: "Müşteri davet bağlantısı oluşturulamadı." };
      }

      await db.transaction(async (tx) => {
        // 1. Status güncelle
        await tx.update(qrCustomerRequests)
          .set({ status: "APPROVED" }) // approvedByCashierId yok galiba schema'da
          .where(eq(qrCustomerRequests.id, requestId));

        // 2. Müşteri oluştur
        await tx.insert(customers).values({
          organizationId: request.organizationId,
          phoneNumber: request.phoneNumber,
          name: `${request.firstName} ${request.lastName}`,
          registrationSource: "CASHIER_INVITE",
        });

        // 3. Activity Log
        await tx.insert(activityLogs).values({
          orgId: request.organizationId,
          type: "QR_REGISTRATION_APPROVED",
          actorName: dbUser.name || "Kasiyer",
          actorRole: dbUser.role,
          targetName: `${request.firstName} ${request.lastName}`,
          description: `${dbUser.name || "Yetkili"}, ${request.firstName} ${request.lastName} adlı müşterinin QR kaydını onayladı.`,
        });
      });

      // Davet mailini Resend ile gönder
      if (invitationUrl) {
        try {
          const emailHtml = getCustomerInvitationTemplate(
            invitationUrl,
            `${request.firstName} ${request.lastName}`,
            orgName,
            branchName
          );

          await resend.emails.send({
            from: "Okut Kazan <onboarding@novexistech.com>",
            to: request.email,
            subject: `${orgName} - Özel Müşteri Daveti`,
            html: emailHtml,
          });
        } catch (resendErr) {
          console.error("Resend mail error:", resendErr);
        }
      }

    } else if (action === "REJECT") {
      await db.transaction(async (tx) => {
        // 1. Status güncelle
        await tx.update(qrCustomerRequests)
          .set({ status: "REJECTED" })
          .where(eq(qrCustomerRequests.id, requestId));

        // 2. Activity Log
        await tx.insert(activityLogs).values({
          orgId: request.organizationId,
          type: "QR_REGISTRATION_REJECTED",
          actorName: dbUser.name || "Kasiyer",
          actorRole: dbUser.role,
          targetName: `${request.firstName} ${request.lastName}`,
          description: `${dbUser.name || "Yetkili"}, ${request.firstName} ${request.lastName} adlı müşterinin QR kaydını reddetti.`,
        });
      });
    }

    // Force revalidate
    revalidatePath("/cashier-dashboard/approvals");
    revalidatePath("/cashier-dashboard", "layout");
    
    return { success: true };

  } catch (error: any) {
    console.error("Approval action error:", error);
    return { error: error.message || "İşlem sırasında bir hata oluştu." };
  }
}
"""

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Updated actions.ts")
