import { BaseService } from "./base-service";
import { customers, loyaltyRules, loyaltyTransactions, branches, users } from "@/db/schema";
import { eq, gte, and, sql, desc } from "drizzle-orm";

export class LoyaltyService extends BaseService {
  /**
   * EARN POINTS (Puan Kazanma)
   * Atomic ACID transaction:
   *  1. Şubeden organizationId'yi çöz.
   *  2. Şirketin earnRatio kural setini çek.
   *  3. Puanı Math.floor ile tam sayı olarak hesapla.
   *  4. customers.totalPoints'i artır.
   *  5. loyalty_transactions'a EARN logu yaz.
   */
  async earnPoints(
    branchId: string,
    cashierId: string,
    customerId: string,
    amountSpentInKurus: number
  ): Promise<{ pointsEarned: number; newTotal: number }> {
    if (amountSpentInKurus <= 0) {
      throw new Error("Harcama tutarı 0'dan büyük olmalıdır.");
    }

    return await this.db.transaction(async (tx) => {
      // 1. Şubeden orgId çöz
      const branch = await tx.select({ orgId: branches.orgId })
        .from(branches)
        .where(eq(branches.id, branchId))
        .get();

      if (!branch) throw new Error("Şube bulunamadı.");
      const { orgId } = branch;

      // 2. Kazanım kuralını çek (varsayılan: 10 = %10)
      const rule = await tx.select({ earnRatio: loyaltyRules.earnRatio })
        .from(loyaltyRules)
        .where(eq(loyaltyRules.organizationId, orgId))
        .get();

      const earnRatio = rule?.earnRatio ?? 10;

      // 3. Finansal Formül Düzeltmesi (kuruş bazında saf tam sayı): Math.floor((amountSpentInKurus * earnRatio) / 10000)
      const pointsEarned = Math.floor((amountSpentInKurus * earnRatio) / 10000);

      if (pointsEarned <= 0) {
        throw new Error("Bu harcama tutarı yeterli puan kazanımı sağlamamaktadır.");
      }

      // 4. Atomik SQL Güncellemesi (Lost Update Guard)
      const updated = await tx
        .update(customers)
        .set({ totalPoints: sql`${customers.totalPoints} + ${pointsEarned}` })
        .where(eq(customers.id, customerId))
        .returning({ newTotal: customers.totalPoints });

      if (!updated[0]) throw new Error("Müşteri bulunamadı veya güncelleme başarısız.");

      // 5. İşlem logu (kuruş/cent bazında)
      await tx.insert(loyaltyTransactions).values({
        organizationId: orgId,
        branchId,
        customerId,
        cashierId,
        type: "EARN",
        amountSpent: amountSpentInKurus,
        pointsAmount: pointsEarned,
      });

      console.log(`[LoyaltyService] ✅ EARN: customerId=${customerId}, earned=${pointsEarned}, newTotal=${updated[0].newTotal}`);

      return { pointsEarned, newTotal: updated[0].newTotal };
    });
  }

  /**
   * BURN POINTS (Puan Harcama)
   * Atomic ACID transaction:
   *  1. Şubeden organizationId'yi çöz.
   *  2. Müşterinin güncel bakiyesini sorgula.
   *  3. Insufficient Balance Guard: Yetersiz bakiyede anında rollback.
   *  4. customers.totalPoints'i düşür.
   *  5. loyalty_transactions'a BURN logu yaz.
   */
  async burnPoints(
    branchId: string,
    cashierId: string,
    customerId: string,
    pointsToBurn: number
  ): Promise<{ pointsBurned: number; newTotal: number }> {
    if (pointsToBurn <= 0) {
      throw new Error("Harcanacak puan miktarı 0'dan büyük olmalıdır.");
    }

    return await this.db.transaction(async (tx) => {
      // 1. Şubeden orgId çöz
      const branch = await tx.select({ orgId: branches.orgId })
        .from(branches)
        .where(eq(branches.id, branchId))
        .get();

      if (!branch) throw new Error("Şube bulunamadı.");
      const { orgId } = branch;

      // 2. Müşterinin güncel bakiyesini kilitle ve sorgula
      const customer = await tx.select({
        totalPoints: customers.totalPoints,
        orgId: customers.organizationId,
      })
        .from(customers)
        .where(eq(customers.id, customerId))
        .get();

      if (!customer) throw new Error("Müşteri bulunamadı.");

      // Cross-Tenant Guard: Müşteri aynı organizasyona mı ait?
      if (customer.orgId !== orgId) {
        throw new Error("Güvenlik İhlali: Müşteri bu organizasyona ait değil.");
      }

      // 3. Katı Bakiye Muhafızı (Insufficient Balance Guard)
      if (customer.totalPoints < pointsToBurn) {
        throw new Error(
          `Müşterinin puan bakiyesi bu ödül için yetersizdir. Mevcut: ${customer.totalPoints}, Gerekli: ${pointsToBurn}`
        );
      }

      // 4. Atomik SQL Güncellemesi + Veritabanı Seviyesinde Yarış Durumu Koruması
      // WHERE koşuluna gte(totalPoints, pointsToBurn) enjekte edilerek,
      // milisaniyeler içinde aynı anda gelen simultâné isteklerin bakiyeyi
      // negatife düşürmesi veritabanı seviyesinde engellenir.
      const result = await tx
        .update(customers)
        .set({ totalPoints: sql`${customers.totalPoints} - ${pointsToBurn}` })
        .where(
          and(
            eq(customers.id, customerId),
            gte(customers.totalPoints, pointsToBurn)  // DB-Level Race Condition Guard
          )
        )
        .returning({ newTotal: customers.totalPoints });

      // rowsAffected === 0: Başka bir istek puanları peşin düşürmüş veya bakıye azınmış.
      if (!result[0]) {
        throw new Error("Müşterinin puan bakiyesi bu ödül için yetersizdir.");
      }

      // 5. İşlem logu
      await tx.insert(loyaltyTransactions).values({
        organizationId: orgId,
        branchId,
        customerId,
        cashierId,
        type: "BURN",
        amountSpent: 0,
        pointsAmount: pointsToBurn,
      });

      console.log(`[LoyaltyService] 🔥 BURN: customerId=${customerId}, burned=${pointsToBurn}, newTotal=${result[0].newTotal}`);

      return { pointsBurned: pointsToBurn, newTotal: result[0].newTotal };
    });
  }

  /**
   * Müşteriyi organizasyon kapsamında telefon numarası ile sorgula.
   * Cross-Tenant Isolation: sadece aynı organizasyondaki müşterileri döner.
   */
  async findCustomerByPhone(organizationId: string, phoneNumber: string) {
    // Drizzle ORM tip-güvenli sorgu – composite index (org_phone_idx) tetiklenir.
    return await this.db.select()
      .from(customers)
      .where(
        and(
          eq(customers.organizationId, organizationId),
          eq(customers.phoneNumber, phoneNumber)
        )
      )
      .get() ?? null;
  }

  /**
   * Yeni müşteri kaydı oluştur.
   * Cross-Tenant Isolation: organizationId zorunludur.
   */
  async registerCustomer(organizationId: string, name: string, phoneNumber: string) {
    // Telefon numarası benzersizlik kontrolü (org kapsamında)
    const existing = await this.findCustomerByPhone(organizationId, phoneNumber);
    if (existing) {
      throw new Error("Bu telefon numarasıyla kayıtlı bir müşteri zaten mevcut.");
    }

    const inserted = await this.db.insert(customers).values({
      organizationId,
      name,
      phoneNumber,
    }).returning();

    return inserted[0];
  }

  /**
   * Şube için en son sadakat işlemlerini (Audit Trail) listele.
   * Silinen profillerin mali loglardan kaybolmaması için leftJoin kullanılmıştır.
   */
  async getRecentTransactions(branchId: string, limit: number = 10) {
    return await this.db
      .select({
        id: loyaltyTransactions.id,
        organizationId: loyaltyTransactions.organizationId,
        branchId: loyaltyTransactions.branchId,
        customerId: loyaltyTransactions.customerId,
        cashierId: loyaltyTransactions.cashierId,
        type: loyaltyTransactions.type,
        amountSpent: loyaltyTransactions.amountSpent,
        pointsAmount: loyaltyTransactions.pointsAmount,
        createdAt: loyaltyTransactions.createdAt,
        customerName: customers.name,
        customerPhone: customers.phoneNumber,
        cashierName: users.name,
        cashierClerkId: users.clerkId,
        cashierEmail: users.email,
      })
      .from(loyaltyTransactions)
      .leftJoin(customers, eq(loyaltyTransactions.customerId, customers.id))
      .leftJoin(users, eq(loyaltyTransactions.cashierId, users.id))
      .where(eq(loyaltyTransactions.branchId, branchId))
      .orderBy(desc(loyaltyTransactions.createdAt))
      .limit(limit)
      .all();
  }

  /**
   * Organizasyonun kazanım kuralı setini güncelle veya oluştur (upsert).
   */
  async upsertLoyaltyRule(organizationId: string, earnRatio: number) {
    if (earnRatio <= 0) {
      throw new Error("Kazanım oranı 0'dan büyük olmalıdır.");
    }

    return await this.db
      .insert(loyaltyRules)
      .values({ organizationId, earnRatio })
      .onConflictDoUpdate({
        target: loyaltyRules.organizationId,
        set: { earnRatio },
      })
      .returning();
  }
}

export const loyaltyService = new LoyaltyService();
