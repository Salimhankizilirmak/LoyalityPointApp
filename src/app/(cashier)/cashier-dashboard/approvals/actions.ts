"use server";

import { db } from "@/db";
import { customerRegistrationRequests, customers, activityLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClerkClient } from "@clerk/backend";
import { checkLayoutGuard } from "@/lib/layout-guard";
import { revalidatePath } from "next/cache";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function handleApprovalAction(requestId: string, action: "APPROVE" | "REJECT") {
  try {
    const dbUser = await checkLayoutGuard();
    if (dbUser.role !== "CASHIER" && dbUser.role !== "MANAGER" && dbUser.role !== "BOSS") {
      throw new Error("Yetkisiz işlem.");
    }

    const request = await db.select().from(customerRegistrationRequests).where(eq(customerRegistrationRequests.id, requestId)).get();
    if (!request) return { error: "Kayıt talebi bulunamadı." };
    if (request.status !== "PENDING_APPROVAL") return { error: "Bu talep zaten işlenmiş." };

    const now = new Date();

    if (action === "APPROVE") {
      await db.transaction(async (tx) => {
        // 1. Status güncelle
        await tx.update(customerRegistrationRequests)
          .set({ status: "APPROVED", approvedByCashierId: dbUser.id, decidedAt: now })
          .where(eq(customerRegistrationRequests.id, requestId));

        // 2. Müşteri oluştur
        await tx.insert(customers).values({
          organizationId: request.orgId,
          phoneNumber: request.phone,
          name: request.name,
          registrationSource: "CASHIER_INVITE",
        });

        // 3. Activity Log
        await tx.insert(activityLogs).values({
          orgId: request.orgId,
          type: "QR_REGISTRATION_APPROVED",
          actorName: dbUser.name || "Kasiyer",
          actorRole: dbUser.role,
          targetName: request.name,
          description: `${dbUser.name || "Yetkili"}, ${request.name} adlı müşterinin QR kaydını onayladı.`,
        });
      });
    } else if (action === "REJECT") {
      await db.transaction(async (tx) => {
        // 1. Status güncelle
        await tx.update(customerRegistrationRequests)
          .set({ status: "REJECTED", approvedByCashierId: dbUser.id, decidedAt: now })
          .where(eq(customerRegistrationRequests.id, requestId));

        // 2. Activity Log
        await tx.insert(activityLogs).values({
          orgId: request.orgId,
          type: "QR_REGISTRATION_REJECTED",
          actorName: dbUser.name || "Kasiyer",
          actorRole: dbUser.role,
          targetName: request.name,
          description: `${dbUser.name || "Yetkili"}, ${request.name} adlı müşterinin QR kaydını reddetti.`,
        });
      });

      // 3. Clerk Account'unu sil
      if (request.clerkUserId) {
        try {
          await clerkClient.users.deleteUser(request.clerkUserId);
        } catch (err) {
          console.error("Clerk delete user failed:", err);
        }
      }
    }

    revalidatePath("/cashier-dashboard/approvals");
    revalidatePath("/cashier-dashboard");
    return { success: true };

  } catch (error: any) {
    console.error("Approval action error:", error);
    return { error: error.message || "İşlem sırasında bir hata oluştu." };
  }
}
