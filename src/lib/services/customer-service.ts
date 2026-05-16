import { BaseService } from "./base-service";
import { customers } from "@/db/schema";
import { eq, or, like } from "drizzle-orm";

export class CustomerService extends BaseService {
  async syncCustomerData() {
    const session = await this.getSession();
    const user = await this.getCurrentUser();

    const existing = await this.db.select().from(customers).where(eq(customers.clerkId, session.userId!)).get();
    if (existing) return existing;

    const meta = user.publicMetadata as { firstName?: string; lastName?: string; phone?: string };
    const result = await this.db.insert(customers).values({
      clerkId: session.userId!,
      firstName: meta.firstName || user.firstName || "İsimsiz",
      lastName: meta.lastName || user.lastName || "Müşteri",
      phone: meta.phone || `NO_PHONE_${session.userId}`,
      email: user.primaryEmailAddress?.emailAddress || `NO_EMAIL_${session.userId}`,
      currentPoints: 0,
    }).returning();

    return result[0];
  }

  async getCustomers(query?: string) {
    await this.requireOrg();
    const base = this.db.select().from(customers);
    
    if (query) {
      const s = `%${query}%`;
      return await base.where(or(
        like(customers.firstName, s),
        like(customers.lastName, s),
        like(customers.phone, s),
        like(customers.email, s)
      )).all();
    }
    return await base.all();
  }

  async updateCustomer(id: string, data: Partial<typeof customers.$inferInsert>) {
    await this.requireOrg();
    await this.db.update(customers).set(data).where(eq(customers.id, id));
    return { success: true };
  }

  async deleteCustomer(id: string) {
    await this.requireOrg();
    await this.db.delete(customers).where(eq(customers.id, id));
    return { success: true };
  }

  async inviteCustomer(data: { firstName: string; lastName: string; phone: string; email: string }) {
    await this.requireOrg();
    const client = await this.getClerkClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    await client.invitations.createInvitation({
      emailAddress: data.email,
      publicMetadata: { ...data, role: "customer" },
      redirectUrl: `${appUrl}/sign-up`,
      ignoreExisting: true
    });

    return { success: true, message: "Müşteri başarıyla davet edildi!" };
  }
}

export const customerService = new CustomerService();
