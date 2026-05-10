"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { customers, pointsTransactions } from "@/db/schema";
import { eq, desc, like, or } from "drizzle-orm";

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

export async function getCustomers(query?: string) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Yetkisiz erişim");

  let baseQuery = db.select().from(customers);
  
  if (query) {
    const search = `%${query}%`;
    return await baseQuery.where(
      or(
        like(customers.firstName, search),
        like(customers.lastName, search),
        like(customers.phone, search),
        like(customers.email, search)
      )
    ).all();
  }

  return await baseQuery.all();
}

export async function updateCustomer(id: string, data: { firstName: string; lastName: string; phone: string; email: string }) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) throw new Error("Yetkisiz erişim");

  // Manager role check could be added here if needed
  
  await db.update(customers).set(data).where(eq(customers.id, id));
  return { success: true };
}

export async function deleteCustomer(id: string) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) throw new Error("Yetkisiz erişim");

  // Transaction'ları da silmek gerekebilir veya pasife çekmek
  // Şimdilik sadece müşteriyi silelim (foreign key constraints'e dikkat)
  await db.delete(customers).where(eq(customers.id, id));
  return { success: true };
}

// Re-exporting member management actions for convenience
export { getOrgMembers, updateMemberName, removeMember } from "../boss-dashboard/actions";
