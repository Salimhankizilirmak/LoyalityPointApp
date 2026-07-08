import { BaseService } from "./base-service";
import { customers, loyaltyRules, loyaltyTransactions, branches, users, campaigns } from "@/db/schema";
import { eq, gte, and, sql, desc, lte } from "drizzle-orm";

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
    amountSpentInKurus: number,
    campaignId?: string
  ): Promise<{ pointsEarned: number; newTotal: number }> {
    if (amountSpentInKurus <= 0) {
      throw new Error("Harcama tutarı 0'dan büyük olmalıdır.");
    }

    return await this.db.transaction(async (tx) => {
      // 1. Şubeden orgId çöz
      const branch = await tx.select({ orgId: branches.orgId, defaultEarnRatio: branches.defaultEarnRatio })
        .from(branches)
        .where(eq(branches.id, branchId))
        .get();

      if (!branch) throw new Error("Şube bulunamadı.");
      const { orgId } = branch;

      // 2. Oran Çözümleme: Öncelik Sırası:
      //    a) Aktif kampanya (tarih aralığı içinde)
      //    b) Şubenin varsayılan kazanım oranı (defaultEarnRatio)
      //    c) loyaltyRules tablosu (geriye dönük uyumluluk)
      const now = new Date();

      let activeCampaign = null;
      if (campaignId) {
        activeCampaign = await tx
          .select({ 
            id: campaigns.id,
            earnRatio: campaigns.earnRatio,
            campaignType: campaigns.campaignType,
            tiers: campaigns.tiers 
          })
          .from(campaigns)
          .where(eq(campaigns.id, campaignId))
          .get();
      } else {
        activeCampaign = await tx
          .select({ 
            id: campaigns.id,
            earnRatio: campaigns.earnRatio,
            campaignType: campaigns.campaignType,
            tiers: campaigns.tiers 
          })
          .from(campaigns)
          .where(
            and(
              eq(campaigns.branchId, branchId),
              eq(campaigns.isActive, true),
              lte(campaigns.startDate, now),
              gte(campaigns.endDate, now)
            )
          )
          .get();
      }

      // Fetch org rule explicitly to get points equivalents
      const orgRule = await tx.select({ 
          earnRatio: loyaltyRules.earnRatio,
          pointsEquivalent: loyaltyRules.pointsEquivalent,
          tlEquivalent: loyaltyRules.tlEquivalent
        })
        .from(loyaltyRules)
        .where(eq(loyaltyRules.organizationId, orgId))
        .get();

      const pointsEq = orgRule?.pointsEquivalent ?? 1;
      const tlEq = orgRule?.tlEquivalent ?? 1;

      let pointsEarned = 0;

      if (activeCampaign && activeCampaign.campaignType === "tiered") {
        const tiersStr = activeCampaign.tiers;
        const tiers = typeof tiersStr === 'string' ? JSON.parse(tiersStr) : tiersStr;
        const spendTl = amountSpentInKurus / 100;
        
        let matchedPoints = 0;
        if (Array.isArray(tiers)) {
          const validTiers = tiers.filter((t: any) => spendTl >= t.limit).sort((a: any, b: any) => b.limit - a.limit);
          if (validTiers.length > 0) {
            matchedPoints = validTiers[0].points;
          }
        }
        pointsEarned = matchedPoints;
      } else {
        let earnRatio: number;

        if (activeCampaign) {
          earnRatio = activeCampaign.earnRatio;
        } else {
          earnRatio = branch.defaultEarnRatio ?? orgRule?.earnRatio ?? 10;
        }

        // Kazanım oranı (earnRatio) direkt bir Yüzde (Örn: 10 = %10) değeridir.
        // amountSpentInKurus (Örn: 50.000 kuruş = 500 TL)
        const tlDegeri = Math.floor((amountSpentInKurus * earnRatio) / 100); // 50000 * 10 / 100 = 5000 Kuruş (Parasal Kazanç = 50 TL)
        pointsEarned = Math.floor((tlDegeri / 100) * (pointsEq / tlEq)); // 50 TL * (100 / 1) = 5000 Puan
      }

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

      await tx.update(customers).set({ lastActiveAt: new Date() }).where(eq(customers.id, customerId));

      console.log(`[LoyaltyService] ✅ EARN: customerId=${customerId}, earned=${pointsEarned}, newTotal=${updated[0].newTotal}`);

      return { pointsEarned, newTotal: updated[0].newTotal };
    });
  }

  /**
   * ADD DIRECT POINTS (Doğrudan Puan Ekleme)
   * Kasiyerin (veya adminin) alışverişten bağımsız (amountSpent = 0) doğrudan müşteriye puan eklediği metot.
   */
  async addDirectPoints(
    branchId: string,
    cashierId: string,
    customerId: string,
    pointsToAdd: number
  ): Promise<{ pointsEarned: number; newTotal: number }> {
    if (pointsToAdd <= 0) {
      throw new Error("Eklenecek puan 0'dan büyük olmalıdır.");
    }

    return await this.db.transaction(async (tx) => {
      const branch = await tx.select({ orgId: branches.orgId })
        .from(branches)
        .where(eq(branches.id, branchId))
        .get();

      if (!branch) throw new Error("Şube bulunamadı.");
      const { orgId } = branch;

      const updated = await tx
        .update(customers)
        .set({ totalPoints: sql`${customers.totalPoints} + ${pointsToAdd}` })
        .where(eq(customers.id, customerId))
        .returning({ newTotal: customers.totalPoints });

      if (!updated[0]) throw new Error("Müşteri bulunamadı veya güncelleme başarısız.");

      await tx.insert(loyaltyTransactions).values({
        organizationId: orgId,
        branchId,
        customerId,
        cashierId,
        type: "EARN",
        amountSpent: 0,
        pointsAmount: pointsToAdd,
      });

      await tx.update(customers).set({ lastActiveAt: new Date() }).where(eq(customers.id, customerId));

      console.log(`[LoyaltyService] ✅ DIRECT_POINTS: customerId=${customerId}, added=${pointsToAdd}, newTotal=${updated[0].newTotal}`);

      return { pointsEarned: pointsToAdd, newTotal: updated[0].newTotal };
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

      await tx.update(customers).set({ lastActiveAt: new Date() }).where(eq(customers.id, customerId));

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
  async getRecentTransactions(branchId: string, limit: number = 10, offset: number = 0) {
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
        status: loyaltyTransactions.status,
        parentTransactionId: loyaltyTransactions.parentTransactionId,
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
      .offset(offset)
      .all();
  }

  /**
   * Ters Kayıt (VOID/REVERSAL) işlemi.
   * ACID transaction güvencesiyle çalışır:
   *  1. Orijinal işlemi doğrular.
   *  2. EARN iptalinde yetersiz bakiye koruması (Double Spending Guard) sağlar.
   *  3. Müşterinin toplam puanını günceller.
   *  4. Orijinal işlemin status alanını VOIDED olarak işaretler.
   *  5. Orijinal işlemin tersi değerlerde type: 'VOID' kaydı atar.
   */
  async voidTransaction(transactionId: string, cashierId: string): Promise<{ success: boolean; newTotal: number }> {
    return await this.db.transaction(async (tx) => {
      // 1. Orijinal işlemi bul
      const originalTx = await tx.select()
        .from(loyaltyTransactions)
        .where(eq(loyaltyTransactions.id, transactionId))
        .get();

      if (!originalTx) {
        throw new Error("İptal edilecek işlem bulunamadı.");
      }

      if (originalTx.status === "VOIDED") {
        throw new Error("Bu işlem zaten iptal edilmiş (Voided).");
      }

      // 2. Müşteriyi bul
      const customer = await tx.select({
        id: customers.id,
        totalPoints: customers.totalPoints,
        orgId: customers.organizationId,
      })
        .from(customers)
        .where(eq(customers.id, originalTx.customerId))
        .get();

      if (!customer) {
        throw new Error("İşleme ait müşteri bulunamadı.");
      }

      let newTotal = customer.totalPoints;

      // 3. Puan Bakiyesi Güncelleme (Bakiye Koruma & ACID)
      if (originalTx.type === "EARN") {
        // Kazanılan puanlar geri alınırken, müşterinin bakiyesi bu tutardan az olamaz.
        const pointsToSubtract = originalTx.pointsAmount;
        if (customer.totalPoints < pointsToSubtract) {
          throw new Error(`Müşteri puan bakiyesi bu işlemin iptali için yetersiz (Puanlar harcanmış olabilir). Mevcut: ${customer.totalPoints}, Geri Alınacak: ${pointsToSubtract}`);
        }

        const result = await tx.update(customers)
          .set({ totalPoints: sql`${customers.totalPoints} - ${pointsToSubtract}` })
          .where(
            and(
              eq(customers.id, customer.id),
              gte(customers.totalPoints, pointsToSubtract) // Race Condition Guard
            )
          )
          .returning({ newTotal: customers.totalPoints });

        if (!result[0]) {
          throw new Error("Puan bakiyesi güncellenirken hata oluştu.");
        }
        newTotal = result[0].newTotal;
      } else if (originalTx.type === "BURN") {
        // Harcanan puanlar iade edilir.
        const pointsToAdd = originalTx.pointsAmount;
        const result = await tx.update(customers)
          .set({ totalPoints: sql`${customers.totalPoints} + ${pointsToAdd}` })
          .where(eq(customers.id, customer.id))
          .returning({ newTotal: customers.totalPoints });

        if (!result[0]) {
          throw new Error("Puan iadesi yapılırken hata oluştu.");
        }
        newTotal = result[0].newTotal;
      }

      // 4. Orijinal işlemin durumunu güncelle
      await tx.update(loyaltyTransactions)
        .set({ status: "VOIDED" })
        .where(eq(loyaltyTransactions.id, transactionId));

      // 5. Zıt değerlerde type: 'VOID' ters kayıt satırı ekle
      await tx.insert(loyaltyTransactions).values({
        organizationId: originalTx.organizationId,
        branchId: originalTx.branchId,
        customerId: originalTx.customerId,
        cashierId: cashierId,
        type: "VOID",
        parentTransactionId: originalTx.id,
        amountSpent: originalTx.amountSpent ? -originalTx.amountSpent : 0,
        pointsAmount: -originalTx.pointsAmount,
        status: "SUCCESS"
      });

      await tx.update(customers).set({ lastActiveAt: new Date() }).where(eq(customers.id, originalTx.customerId));

      console.log(`[LoyaltyService] ↩️ VOID SUCCESS: originalTxId=${transactionId}, customerId=${customer.id}, newTotal=${newTotal}`);

      return { success: true, newTotal };
    });
  }

  /**
   * Organizasyonun kazanım kuralı setini güncelle veya oluştur (upsert).
   */
  async upsertLoyaltyRule(
    organizationId: string, 
    earnRatio: number,
    pointsEquivalent: number = 1,
    tlEquivalent: number = 1
  ) {
    if (earnRatio <= 0) {
      throw new Error("Kazanım oranı 0'dan büyük olmalıdır.");
    }
    if (pointsEquivalent <= 0 || tlEquivalent <= 0) {
      throw new Error("Parite değerleri 0'dan büyük olmalıdır.");
    }

    return await this.db
      .insert(loyaltyRules)
      .values({ organizationId, earnRatio, pointsEquivalent, tlEquivalent })
      .onConflictDoUpdate({
        target: loyaltyRules.organizationId,
        set: { earnRatio, pointsEquivalent, tlEquivalent },
      })
      .returning();
  }
}

export const loyaltyService = new LoyaltyService();
