import { BaseService } from "./base-service";
import { customers, pointsTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export class PointsService extends BaseService {
  async processTransaction(customerId: string, amountTL: number, type: "earn" | "spend") {
    const session = await this.getSession();
    const orgId = await this.requireOrg();
    const isDemo = await this.isShowcaseOrg(orgId);
    
    const user = await this.getCurrentUser();
    const branchId = (user.publicMetadata?.branch_id as string) || "unknown";

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
        branchId,
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
    const { user } = await this.requireRole(["manager", "boss", "superadmin"]);
    
    const branchId = (user.publicMetadata?.branch_id as string) || "unknown";

    const customer = await this.db.select().from(customers).where(eq(customers.id, customerId)).get();
    if (!customer) throw new Error("Müşteri bulunamadı.");

    await this.db.transaction(async (tx) => {
      await tx.insert(pointsTransactions).values({
        customerId: customer.id,
        employeeId: session.userId!,
        orgId,
        branchId,
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
    const user = await this.getCurrentUser();
    const role = (user.publicMetadata?.role as string) || "customer";
    
    let baseQuery = this.db.select({
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
    .leftJoin(customers, eq(pointsTransactions.customerId, customers.id));

    if (role === "boss" || role === "superadmin") {
      // Boss tüm şubelerin işlemlerini görebilir
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      baseQuery = baseQuery.where(eq(pointsTransactions.orgId, orgId)) as any;
    } else {
      // Manager ve Cashier sadece kendi şubelerini görebilir (RLS / IDOR Koruması)
      const branchId = (user.publicMetadata?.branch_id as string) || "none";
      const { and } = await import("drizzle-orm");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      baseQuery = baseQuery.where(and(eq(pointsTransactions.orgId, orgId), eq(pointsTransactions.branchId, branchId))) as any;
    }

    return await baseQuery.orderBy(desc(pointsTransactions.createdAt)).limit(50);
  }
}

export const pointsService = new PointsService();
