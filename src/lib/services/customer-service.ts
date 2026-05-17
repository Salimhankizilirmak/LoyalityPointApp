import { BaseService } from "./base-service";
import { users, customerProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export class CustomerService extends BaseService {
  async syncCustomerData() {
    const session = await this.getSession();
    const user = await this.getCurrentUser();

    // Ensure users table record exists
    let dbUser = await this.db.select().from(users).where(eq(users.clerkId, session.userId!)).get();
    if (!dbUser) {
      const inserted = await this.db.insert(users).values({
        clerkId: session.userId!,
        email: user.primaryEmailAddress?.emailAddress || `no-email-${session.userId}@customer.com`,
        role: "CUSTOMER",
      }).returning();
      dbUser = inserted[0];
    }

    const meta = (user.publicMetadata || {}) as Record<string, unknown>;
    const orgId = session.orgId || (meta.org_id as string) || "showcase";

    // Ensure customer_profiles table record exists
    let profile = await this.db.select().from(customerProfiles).where(eq(customerProfiles.userId, dbUser.id)).get();
    if (!profile) {
      const insertedProfile = await this.db.insert(customerProfiles).values({
        userId: dbUser.id,
        orgId: orgId,
        currentPoints: 0,
      }).returning();
      profile = insertedProfile[0];
    }

    return {
      id: dbUser.id,
      clerkId: dbUser.clerkId,
      firstName: user.firstName || "İsimsiz",
      lastName: user.lastName || "Müşteri",
      phone: (meta.phone as string) || "",
      email: dbUser.email,
      currentPoints: profile.currentPoints,
    };
  }

  async getCustomers(query?: string) {
    const orgId = await this.requireOrg();

    const result = await this.db.select({
      id: users.id,
      profileId: customerProfiles.id,
      clerkId: users.clerkId,
      email: users.email,
      currentPoints: customerProfiles.currentPoints,
    })
    .from(customerProfiles)
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .where(eq(customerProfiles.orgId, orgId))
    .all();

    const client = await this.getClerkClient();
    const enriched = await Promise.all(result.map(async (c) => {
      try {
        const u = await client.users.getUser(c.clerkId);
        const meta = (u.publicMetadata || {}) as Record<string, unknown>;
        return {
          id: c.id,
          profileId: c.profileId,
          clerkId: c.clerkId,
          firstName: u.firstName || "İsimsiz",
          lastName: u.lastName || "Müşteri",
          phone: (meta.phone as string) || "",
          email: c.email,
          currentPoints: c.currentPoints,
        };
      } catch {
        return {
          id: c.id,
          profileId: c.profileId,
          clerkId: c.clerkId,
          firstName: c.email.split("@")[0],
          lastName: "Müşteri",
          phone: "",
          email: c.email,
          currentPoints: c.currentPoints,
        };
      }
    }));

    if (query) {
      const q = query.toLowerCase();
      return enriched.filter(e => 
        e.firstName.toLowerCase().includes(q) || 
        e.lastName.toLowerCase().includes(q) || 
        e.phone.includes(q) || 
        e.email.toLowerCase().includes(q)
      );
    }

    return enriched;
  }

  async updateCustomer(id: string, data: Partial<typeof customerProfiles.$inferInsert>) {
    await this.requireOrg();
    
    const profile = await this.db.select().from(customerProfiles).where(eq(customerProfiles.id, id)).get()
      || await this.db.select().from(customerProfiles).where(eq(customerProfiles.userId, id)).get();
      
    if (profile) {
      await this.db.update(customerProfiles).set(data).where(eq(customerProfiles.id, profile.id));
    }
    return { success: true };
  }

  async deleteCustomer(id: string) {
    await this.requireOrg();
    
    const profile = await this.db.select().from(customerProfiles).where(eq(customerProfiles.id, id)).get()
      || await this.db.select().from(customerProfiles).where(eq(customerProfiles.userId, id)).get();
    
    if (profile) {
      await this.db.delete(customerProfiles).where(eq(customerProfiles.id, profile.id));
      await this.db.delete(users).where(eq(users.id, profile.userId));
    }
    return { success: true };
  }

  async inviteCustomer(data: { firstName: string; lastName: string; phone: string; email: string }) {
    const orgId = await this.requireOrg();
    const client = await this.getClerkClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    await client.invitations.createInvitation({
      emailAddress: data.email,
      publicMetadata: { 
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: "customer",
        org_id: orgId,
      },
      redirectUrl: `${appUrl}/sign-up`,
      ignoreExisting: true
    });

    return { success: true, message: "Müşteri başarıyla davet edildi!" };
  }
}

export const customerService = new CustomerService();
