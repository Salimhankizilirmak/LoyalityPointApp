import { BaseService } from "./base-service";
import { users, customerProfiles, pointsTransactions, staffProfiles } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export class PointsService extends BaseService {
  async processTransaction(customerId: string, amountTL: number, type: "earn" | "spend") {
    // Resolve branchId from current staff profile in DB
    const { userId } = await this.getSession();
    const dbUserLocal = await this.getLocalUser(userId!);
    let branchId = "unknown";
    if (dbUserLocal) {
      const staffProfile = await this.db.select().from(staffProfiles).where(eq(staffProfiles.userId, dbUserLocal.id)).get();
      if (staffProfile) {
        branchId = staffProfile.branchId;
      }
    }

    let pointsKurus = 0;
    if (type === "earn") {
      pointsKurus = Math.floor(amountTL * 0.10 * 100); 
    } else {
      pointsKurus = Math.floor(amountTL * 100);
    }

    // Resolve customer profile
    const dbUser = await this.db.select().from(users).where(eq(users.clerkId, customerId)).get()
      || await this.db.select().from(users).where(eq(users.id, customerId)).get();
    
    let profile = null;
    if (dbUser) {
      profile = await this.db.select().from(customerProfiles).where(eq(customerProfiles.userId, dbUser.id)).get();
    } else {
      profile = await this.db.select().from(customerProfiles).where(eq(customerProfiles.id, customerId)).get();
    }

    if (!profile) throw new Error("Müşteri profili bulunamadı.");

    if (type === "spend" && profile.currentPoints < pointsKurus) {
      throw new Error(`Yetersiz bakiye. Güncel: ${(profile.currentPoints / 100).toFixed(2)} TL`);
    }

    const amountToApply = type === "earn" ? pointsKurus : -pointsKurus;

    // Secure Audit Ledger transaction
    await this.db.transaction(async (tx) => {
      await tx.insert(pointsTransactions).values({
        customerProfileId: profile.id,
        branchId: branchId,
        amount: amountToApply,
        type: type === "earn" ? "EARN" : "SPEND",
        description: type === "earn" ? `${amountTL} TL tutarında işlemden kazanılan puan` : `${amountTL} TL değerinde harcanan puan`,
      });

      await tx.update(customerProfiles)
        .set({ currentPoints: sql`${customerProfiles.currentPoints} + ${amountToApply}` })
        .where(eq(customerProfiles.id, profile.id));
    });

    return { success: true };
  }

  async manualAdjustment(customerId: string, amountKurus: number) {
    await this.requireRole(["MANAGER", "BOSS", "SUPER_ADMIN"]);
    
    // Resolve branchId of current staff profile
    const { userId } = await this.getSession();
    const dbUserLocal = await this.getLocalUser(userId!);
    let branchId = "unknown";
    if (dbUserLocal) {
      const staffProfile = await this.db.select().from(staffProfiles).where(eq(staffProfiles.userId, dbUserLocal.id)).get();
      if (staffProfile) {
        branchId = staffProfile.branchId;
      }
    }

    // Resolve customer profile
    const profile = await this.db.select().from(customerProfiles).where(eq(customerProfiles.id, customerId)).get()
      || await this.db.select().from(customerProfiles).where(eq(customerProfiles.userId, customerId)).get();
      
    if (!profile) throw new Error("Müşteri profili bulunamadı.");

    await this.db.transaction(async (tx) => {
      await tx.insert(pointsTransactions).values({
        customerProfileId: profile.id,
        branchId: branchId,
        amount: amountKurus,
        type: amountKurus >= 0 ? "EARN" : "SPEND",
        description: "Yönetici Tarafından Manuel Düzenleme",
      });

      await tx.update(customerProfiles)
        .set({ currentPoints: sql`${customerProfiles.currentPoints} + ${amountKurus}` })
        .where(eq(customerProfiles.id, profile.id));
    });

    return { success: true };
  }

  async getCustomerTransactions() {
    const { userId } = await this.getSession();
    const dbUser = await this.getLocalUser(userId!);
    if (!dbUser) return [];

    const profile = await this.db.select().from(customerProfiles).where(eq(customerProfiles.userId, dbUser.id)).get();
    if (!profile) return [];

    const txs = await this.db.select()
      .from(pointsTransactions)
      .where(eq(pointsTransactions.customerProfileId, profile.id))
      .orderBy(desc(pointsTransactions.createdAt))
      .limit(10)
      .all();

    // Map to backward compatible formats if necessary
    return txs.map(t => ({
      id: t.id,
      amount: t.amount,
      transactionType: t.type.toLowerCase(),
      createdAt: t.createdAt,
      description: t.description,
    }));
  }

  async getBranchTransactions() {
    const orgId = await this.requireOrg();
    const { userId } = await this.getSession();
    const dbUser = await this.getLocalUser(userId!);
    if (!dbUser) return [];
    
    let whereClause;
    if (dbUser.role === "BOSS" || dbUser.role === "SUPER_ADMIN") {
      whereClause = eq(customerProfiles.orgId, orgId);
    } else {
      const staffProfile = await this.db.select().from(staffProfiles).where(eq(staffProfiles.userId, dbUser.id)).get();
      const branchId = staffProfile ? staffProfile.branchId : "none";
      whereClause = and(eq(customerProfiles.orgId, orgId), eq(pointsTransactions.branchId, branchId));
    }

    const txs = await this.db.select({
      id: pointsTransactions.id,
      amount: pointsTransactions.amount,
      type: pointsTransactions.type,
      description: pointsTransactions.description,
      createdAt: pointsTransactions.createdAt,
      customerProfileId: pointsTransactions.customerProfileId,
      branchId: pointsTransactions.branchId,
      clerkId: users.clerkId,
      email: users.email,
    })
    .from(pointsTransactions)
    .innerJoin(customerProfiles, eq(pointsTransactions.customerProfileId, customerProfiles.id))
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .where(whereClause)
    .orderBy(desc(pointsTransactions.createdAt))
    .limit(50)
    .all();

    const client = await this.getClerkClient();
    return await Promise.all(txs.map(async (t) => {
      try {
        const u = await client.users.getUser(t.clerkId);
        return {
          id: t.id,
          amount: t.amount,
          transactionType: t.type.toLowerCase(), 
          createdAt: t.createdAt,
          customerFirstName: u.firstName || "İsimsiz",
          customerLastName: u.lastName || "Müşteri",
          customerId: t.customerProfileId,
        };
      } catch {
        return {
          id: t.id,
          amount: t.amount,
          transactionType: t.type.toLowerCase(),
          createdAt: t.createdAt,
          customerFirstName: t.email.split("@")[0],
          customerLastName: "Müşteri",
          customerId: t.customerProfileId,
        };
      }
    }));
  }
}

export const pointsService = new PointsService();
