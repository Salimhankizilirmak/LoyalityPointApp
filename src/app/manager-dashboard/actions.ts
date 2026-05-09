"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { customers, pointsTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getBranchTransactions() {
  const { orgId } = await auth();
  if (!orgId) return [];

  // İşlemleri ve müşteri bilgilerini JOIN ile çek
  const txs = await db.select({
    id: pointsTransactions.id,
    amount: pointsTransactions.amount,
    type: pointsTransactions.transactionType,
    createdAt: pointsTransactions.createdAt,
    employeeId: pointsTransactions.employeeId,
    customerFirstName: customers.firstName,
    customerLastName: customers.lastName,
    customerId: customers.id,
    customerClerkId: customers.clerkId
  })
  .from(pointsTransactions)
  .leftJoin(customers, eq(pointsTransactions.customerId, customers.id))
  .where(eq(pointsTransactions.orgId, orgId))
  .orderBy(desc(pointsTransactions.createdAt))
  .limit(50); // Şube bazlı son 50 işlem

  return txs;
}

export async function manualAdjustmentAction(customerId: string, amountKurusStr: string) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Yetkisiz işlem." };

  const amountKurus = parseInt(amountKurusStr, 10);
  if (isNaN(amountKurus) || amountKurus === 0) return { error: "Geçerli bir tutar giriniz." };

  const customer = await db.select().from(customers).where(eq(customers.id, customerId)).get();
  if (!customer) return { error: "Müşteri bulunamadı." };

  if (customer.currentPoints + amountKurus < 0) {
    return { error: "Müşterinin puanı eksiye düşemez. Düşülecek puan mevcut bakiyeden fazla." };
  }

  try {
    await db.insert(pointsTransactions).values({
      customerId: customer.id,
      employeeId: userId, // Yöneticinin kimliği
      orgId: orgId,
      amount: amountKurus, // Pozitif veya negatif olabilir
      transactionType: "manual_adjustment",
    });

    await db.update(customers)
      .set({ currentPoints: customer.currentPoints + amountKurus })
      .where(eq(customers.id, customer.id));

    return { success: true, message: `Manuel puan düzeltmesi başarıyla uygulandı.` };
  } catch (error: any) {
    console.error("Adjustment error:", error);
    return { error: "Düzeltme sırasında hata oluştu." };
  }
}
