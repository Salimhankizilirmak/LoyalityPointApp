"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { customers, pointsTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function inviteCustomerAction(formData: FormData) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Yetkisiz işlem veya aktif şube seçilmedi. Kasiyerlerin bir şubede olması gerekir." };

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;

  try {
    const client = await clerkClient();
    await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        firstName,
        lastName,
        phone,
        role: "customer"
      },
      ignoreExisting: true
    });

    return { success: true, message: "Müşteri başarıyla davet edildi! E-postasına kayıt linki gönderildi." };
  } catch (error: any) {
    console.error("Invite error:", error);
    return { error: error.message || "Davet gönderilirken bir hata oluştu." };
  }
}

export async function findCustomerById(clerkId: string) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return null;

  const customer = await db.select().from(customers).where(eq(customers.clerkId, clerkId)).get();
  return customer;
}

export async function processTransactionAction(customerId: string, amountStr: string, type: "earn" | "spend") {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return { error: "Yetkisiz işlem." };

  const amountTL = parseFloat(amountStr);
  if (isNaN(amountTL) || amountTL <= 0) return { error: "Geçerli bir tutar giriniz." };

  let pointsKurus = 0;
  if (type === "earn") {
    // Alışveriş tutarının %10'u kadar puan kazanılır (Örn: 100 TL -> 10 Puan/TL)
    pointsKurus = Math.floor(amountTL * 0.10 * 100); 
  } else {
    // Harcama tutarı direkt puan olarak (kuruş cinsinden) düşülür
    pointsKurus = Math.floor(amountTL * 100);
  }

  const customer = await db.select().from(customers).where(eq(customers.clerkId, customerId)).get();
  if (!customer) return { error: "Müşteri veritabanında bulunamadı. Müşteri henüz ilk girişini yapmamış olabilir." };

  if (type === "spend" && customer.currentPoints < pointsKurus) {
    return { error: `Yetersiz bakiye. Güncel bakiye: ${(customer.currentPoints / 100).toFixed(2)} TL` };
  }

  try {
    const amountToApply = type === "earn" ? pointsKurus : -pointsKurus;

    // İşlemi Logla
    await db.insert(pointsTransactions).values({
      customerId: customer.id,
      employeeId: userId,
      orgId: orgId,
      amount: amountToApply,
      transactionType: type,
    });

    // Müşteri Puanını Güncelle
    await db.update(customers)
      .set({ currentPoints: customer.currentPoints + amountToApply })
      .where(eq(customers.id, customer.id));

    return { 
      success: true, 
      message: type === "earn" ? `${(pointsKurus / 100).toFixed(2)} TL değerinde puan müşteriye başarıyla yüklendi!` : `${(pointsKurus / 100).toFixed(2)} TL Puan başarıyla harcandı/düşüldü!` 
    };
  } catch (error: any) {
    console.error("Transaction error:", error);
    return { error: "İşlem sırasında veritabanı hatası oluştu." };
  }
}
