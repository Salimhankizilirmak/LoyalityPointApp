import { BaseService } from "./base-service";
import { customers, pointsTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export class PointsService extends BaseService {
  async processTransaction(customerId: string, amountTL: number, type: "earn" | "spend") {
    const session = await this.getSession();
    const orgId = await this.requireOrg();
    const isDemo = await this.isShowcaseOrg(orgId);

    let pointsKurus = 0;
    if (type === "earn") {
      pointsKurus = Math.floor(amountTL * 0.10 * 100); 
    } else {
      pointsKurus = Math.floor(amountTL * 100);
    }

    const customer = await this.db.select().from(customers).where(eq(customers.clerkId, customerId)).get();
    if (!customer) throw new Error("Müşteri bulunamadı.");

    if (type === "spend" && customer.currentPoints < pointsKurus) {
      throw new Error(`Yetersiz bakiye. Güncel: ${(customer.currentPoints / 100).toFixed(2)} TL`);
    }

    const amountToApply = type === "earn" ? pointsKurus : -pointsKurus;

    await this.db.transaction(async (tx) => {
      await tx.insert(pointsTransactions).values({
        customerId: customer.id,
        employeeId: session.userId!,
        orgId,
        amount: amountToApply,
        transactionType: type,
        isDemo,
      });

      await tx.update(customers)
        .set({ currentPoints: customer.currentPoints + amountToApply })
        .where(eq(customers.id, customer.id));
    });

    return { success: true };
  }

  async manualAdjustment(customerId: string, amountKurus: number) {
    const session = await this.getSession();
    const orgId = await this.requireOrg();
    const isDemo = await this.isShowcaseOrg(orgId);
    await this.requireRole(["manager", "boss", "superadmin"]);

    const customer = await this.db.select().from(customers).where(eq(customers.id, customerId)).get();
    if (!customer) throw new Error("Müşteri bulunamadı.");

    await this.db.transaction(async (tx) => {
      await tx.insert(pointsTransactions).values({
        customerId: customer.id,
        employeeId: session.userId!,
        orgId,
        amount: amountKurus,
        transactionType: "manual_adjustment",
        isDemo,
      });

      await tx.update(customers)
        .set({ currentPoints: customer.currentPoints + amountKurus })
        .where(eq(customers.id, customer.id));
    });

    return { success: true };
  }

  async getCustomerTransactions() {
    const { userId } = await this.getSession();
    const customer = await this.db.select({ id: customers.id }).from(customers).where(eq(customers.clerkId, userId)).get();
    if (!customer) return [];

    return await this.db.select()
      .from(pointsTransactions)
      .where(eq(pointsTransactions.customerId, customer.id))
      .orderBy(desc(pointsTransactions.createdAt))
      .limit(10);
  }

  async getBranchTransactions() {
    const orgId = await this.requireOrg();
    return await this.db.select({
      id: pointsTransactions.id,
      amount: pointsTransactions.amount,
      type: pointsTransactions.transactionType,
      createdAt: pointsTransactions.createdAt,
      employeeId: pointsTransactions.employeeId,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      customerId: customers.id,
    })
    .from(pointsTransactions)
    .leftJoin(customers, eq(pointsTransactions.customerId, customers.id))
    .where(eq(pointsTransactions.orgId, orgId))
    .orderBy(desc(pointsTransactions.createdAt))
    .limit(50);
  }
}

export const pointsService = new PointsService();
