import { db } from "@/db";
import { users, customers, invitations, customerRegistrationRequests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";

export const identityService = {
  /**
   * Bir müşterinin veya personelin ismini tüm ilişkili tablolarda eşzamanlı olarak günceller.
   * Canlı sistemdeki verileri bozmamak için sadece "name" veya "customerName" sütunlarına dokunur.
   */
  async syncUserName(params: {
    phoneNumber?: string; 
    email?: string;       
    orgId?: string;       
    newName: string;
  }) {
    const { phoneNumber, email, orgId, newName } = params;
    const cleanName = newName.trim();
    if (!cleanName) return { success: false, error: "İsim boş olamaz." };

    let affectedTables: string[] = [];

    // Müşteri İsmi Senkronizasyonu (Telefon ve OrgId üzerinden)
    if (phoneNumber && orgId) {
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      const normalizedPhone = cleanPhone.length >= 10 ? '0' + cleanPhone.slice(-10) : phoneNumber;
      
      // 1. Customers Tablosu
      try {
        await db.update(customers)
          .set({ name: cleanName })
          .where(and(
            eq(customers.organizationId, orgId),
            eq(customers.phoneNumber, normalizedPhone)
          ));
        affectedTables.push("customers");
      } catch (err) {
        console.error("[IdentitySync] customers update error:", err);
      }
      
      // 2. Invitations Tablosu
      try {
        // Invitations tablosunda phoneNumber 0 olmadan veya formatlı durabiliyor.
        // Güvenli olması adına iki ihtimali de güncelleyelim.
        await db.update(invitations)
          .set({ customerName: cleanName })
          .where(and(
            eq(invitations.organizationId, orgId),
            eq(invitations.phoneNumber, cleanPhone)
          ));
        
        await db.update(invitations)
          .set({ customerName: cleanName })
          .where(and(
            eq(invitations.organizationId, orgId),
            eq(invitations.phoneNumber, normalizedPhone)
          ));
        affectedTables.push("invitations");
      } catch (err) {
        console.error("[IdentitySync] invitations update error:", err);
      }

      // 3. Registration Requests Tablosu
      try {
        await db.update(customerRegistrationRequests)
          .set({ name: cleanName })
          .where(and(
            eq(customerRegistrationRequests.orgId, orgId),
            eq(customerRegistrationRequests.phone, cleanPhone)
          ));
        affectedTables.push("customerRegistrationRequests");
      } catch (err) {
         console.error("[IdentitySync] registration_requests update error:", err);
      }

      // 4. Users & Clerk Tablosu (Eğer Kayıtlı Müşteri İse)
      try {
        const existingUser = await db.select().from(users).where(eq(users.username, normalizedPhone)).get();
        if (existingUser) {
          // Kendi lokal users tablomuz
          await db.update(users).set({ name: cleanName }).where(eq(users.id, existingUser.id));
          affectedTables.push("users");

          // Clerk Kimlik Sağlayıcı
          try {
            const parts = cleanName.split(/\s+/);
            const firstName = parts.slice(0, -1).join(" ") || parts[0];
            const lastName = parts.length > 1 ? parts[parts.length - 1] : "";
            
            const client = await clerkClient();
            await client.users.updateUser(existingUser.clerkId, {
              firstName,
              lastName
            });
            affectedTables.push("clerk");
          } catch (clerkErr) {
            console.error("[IdentitySync] Clerk update error:", clerkErr);
          }
        }
      } catch (err) {
        console.error("[IdentitySync] users update error:", err);
      }
    }

    return { success: true, affectedTables };
  }
};
