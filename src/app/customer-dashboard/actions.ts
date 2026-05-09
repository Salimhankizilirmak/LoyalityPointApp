"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { customers, pointsTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function syncCustomerData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Yetkisiz erişim");

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  // Veritabanında müşteri var mı kontrol et
  const existing = await db.select().from(customers).where(eq(customers.clerkId, userId)).get();

  if (!existing) {
    // Yoksa Clerk üzerinden veya publicMetadata'dan verileri al
    const firstName = (user.publicMetadata.firstName as string) || user.firstName || "İsimsiz";
    const lastName = (user.publicMetadata.lastName as string) || user.lastName || "Müşteri";
    const phone = (user.publicMetadata.phone as string) || `NO_PHONE_${userId}`;
    const email = user.primaryEmailAddress?.emailAddress || `NO_EMAIL_${userId}`;

    try {
      const result = await db.insert(customers).values({
        clerkId: userId,
        firstName,
        lastName,
        phone,
        email,
        currentPoints: 0,
      }).returning();
      
      return result[0];
    } catch (e) {
      console.error("Müşteri oluşturulurken hata:", e);
      // Telefon veya email eşsiz (unique) olduğu için hata verebilir.
      return null;
    }
  }
  
  return existing;
}

export async function getCustomerTransactions() {
  const { userId } = await auth();
  if (!userId) return [];

  const customer = await db.select({ id: customers.id }).from(customers).where(eq(customers.clerkId, userId)).get();
  
  if (!customer) return [];

  const txs = await db.select()
    .from(pointsTransactions)
    .where(eq(pointsTransactions.customerId, customer.id))
    .orderBy(desc(pointsTransactions.createdAt))
    .limit(10);
    
  return txs;
}
