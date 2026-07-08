import { BaseService } from "./base-service";
import { campaigns, branches, organizations, loyaltyTransactions, customers } from "@/db/schema";
import { eq, and, lte, gte, or, gt, lt, inArray, isNull } from "drizzle-orm";

export interface CreateCampaignInput {
  branchId: string;
  createdBy: string;
  name: string;
  campaignType: "multiplier" | "tiered";
  earnRatio: number;
  tiers?: string | null;
  startDate: Date;
  endDate: Date;
  description?: string;
}

export class CampaignService extends BaseService {
  /**
   * Tarih çakışma kontrolü.
   * Yeni kampanyanın tarih aralığı, mevcut aktif kampanyalarla örtüşüyorsa hata fırlatır.
   * Çakışma koşulu: NOT (yeni.end <= mevcut.start OR yeni.start >= mevcut.end)
   */
  private async checkOverlap(
    branchId: string,
    startDate: Date,
    endDate: Date,
    excludeId?: string
  ): Promise<void> {
    const existing = await this.db
      .select({ id: campaigns.id, name: campaigns.name, startDate: campaigns.startDate, endDate: campaigns.endDate })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.branchId, branchId),
          eq(campaigns.isActive, true),
          // Tarih aralıkları kesişiyor mu? start < mevcut.end AND end > mevcut.start
          lt(campaigns.startDate, endDate),
          gt(campaigns.endDate, startDate)
        )
      )
      .all();

    const conflicting = excludeId
      ? existing.filter((c) => c.id !== excludeId)
      : existing;

    if (conflicting.length > 0) {
      const c = conflicting[0];
      const startStr = c.startDate ? new Date(c.startDate).toLocaleDateString("tr-TR") : "?";
      const endStr = c.endDate ? new Date(c.endDate).toLocaleDateString("tr-TR") : "?";
      throw new Error(
        `Bu tarih aralığı "${c.name}" kampanyasıyla (${startStr} - ${endStr}) çakışıyor. Lütfen farklı bir tarih aralığı seçin.`
      );
    }
  }

  /**
   * Yeni kampanya oluştur.
   * Tarih çakışma kontrolü dahil.
   */
  async createCampaign(input: CreateCampaignInput) {
    if (input.campaignType === "multiplier" && (input.earnRatio <= 0 || input.earnRatio > 100)) {
      throw new Error("Kampanya kazanım oranı 1 ile 100 arasında olmalıdır.");
    }
    if (input.campaignType === "tiered") {
      if (!input.tiers || (Array.isArray(input.tiers) && input.tiers.length === 0) || (typeof input.tiers === "string" && (input.tiers.trim() === "[]" || input.tiers === ""))) {
        throw new Error("Kademeli kampanyalarda en az 1 kademe girilmelidir.");
      }
    }
    if (input.startDate >= input.endDate) {
      throw new Error("Kampanya başlangıç tarihi bitiş tarihinden önce olmalıdır.");
    }
    if (input.endDate <= new Date()) {
      throw new Error("Kampanya bitiş tarihi gelecekte bir tarih olmalıdır.");
    }

    await this.checkOverlap(input.branchId, input.startDate, input.endDate);

    const [inserted] = await this.db
      .insert(campaigns)
      .values({
        branchId: input.branchId,
        createdBy: input.createdBy,
        name: input.name,
        campaignType: input.campaignType,
        earnRatio: input.earnRatio,
        tiers: input.tiers,
        startDate: input.startDate,
        endDate: input.endDate,
        description: input.description,
        isActive: true,
      })
      .returning();

    return inserted;
  }

  /**
   * Belirli bir şubenin şu an aktif kampanyasını döner.
   * Aktif = isActive:true VE startDate <= now <= endDate
   */
  async getActiveCampaignForBranch(branchId: string) {
    const now = new Date();
    return await this.db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.branchId, branchId),
          eq(campaigns.isActive, true),
          lte(campaigns.startDate, now),
          gte(campaigns.endDate, now)
        )
      )
      .get() ?? null;
  }

  /**
   * Bir şubenin tüm kampanyalarını döner (geçmiş dahil, oluşturulma zamanına göre sıralı).
   */
  async getCampaignsByBranch(branchId: string) {
    return await this.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.branchId, branchId))
      .orderBy(campaigns.createdAt)
      .all();
  }

  /**
   * Bir organizasyonun tüm şubelerindeki aktif kampanyaları döner.
   * Müşteri dashboard'u için kullanılır.
   */
  async getActiveCampaignsByOrg(orgId: string) {
    const now = new Date();

    // Organizasyona ait şubeleri al
    const orgBranches = await this.db
      .select({ id: branches.id, name: branches.name })
      .from(branches)
      .where(and(eq(branches.orgId, orgId), eq(branches.isActive, true)))
      .all();

    if (orgBranches.length === 0) return [];

    const branchIds = orgBranches.map((b) => b.id);
    const branchMap = new Map(orgBranches.map((b) => [b.id, b.name]));

    // Tüm şubelerin aktif kampanyalarını al
    const activeCampaigns = await this.db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.isActive, true),
          lte(campaigns.startDate, now),
          gte(campaigns.endDate, now)
        )
      )
      .all();

    return activeCampaigns
      .filter((c) => branchIds.includes(c.branchId))
      .map((c) => ({
        ...c,
        branchName: branchMap.get(c.branchId) ?? "Bilinmeyen Şube",
      }));
  }

  /**
   * Kampanyayı manuel olarak sonlandır (isActive = false).
   */
  async deactivateCampaign(campaignId: string, branchId: string) {
    const campaign = await this.db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.branchId, branchId)))
      .get();

    if (!campaign) {
      throw new Error("Kampanya bulunamadı veya bu şubeye ait değil.");
    }

    await this.db
      .update(campaigns)
      .set({ isActive: false })
      .where(eq(campaigns.id, campaignId));

    return { success: true };
  }

  /**
   * Bir kampanyanın metriklerini getirir (dağıtılan puan, harcanan puan, yeni müşteri sayısı vs.)
   */
  async getCampaignAnalytics(campaignId: string, branchId: string) {
    const campaign = await this.db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.branchId, branchId)))
      .get();

    if (!campaign) {
      throw new Error("Kampanya bulunamadı.");
    }

    // İlgili tarih ve şubedeki işlemleri çekelim
    const txs = await this.db
      .select()
      .from(loyaltyTransactions)
      .where(
        and(
          eq(loyaltyTransactions.branchId, branchId),
          eq(loyaltyTransactions.status, "SUCCESS"),
          gte(loyaltyTransactions.createdAt, campaign.startDate),
          lte(loyaltyTransactions.createdAt, campaign.endDate ?? new Date())
        )
      )
      .all();

    let distributedPoints = 0;
    let spentPoints = 0;
    const uniqueCustomerIds = new Set<string>();

    for (const tx of txs) {
      uniqueCustomerIds.add(tx.customerId);
      if (tx.type === "EARN") {
        distributedPoints += tx.pointsAmount;
      } else if (tx.type === "BURN") {
        spentPoints += tx.pointsAmount;
      }
    }

    let newCustomersCount = 0;
    
    if (uniqueCustomerIds.size > 0) {
      const allCustomers = await this.db
        .select({ id: customers.id, createdAt: customers.createdAt })
        .from(customers)
        .where(
          and(
            inArray(customers.id, Array.from(uniqueCustomerIds)),
            gte(customers.createdAt, campaign.startDate),
            lte(customers.createdAt, campaign.endDate ?? new Date())
          )
        )
        .all();
      
      newCustomersCount = allCustomers.length;
    }

    return {
      campaignName: campaign.name,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      distributedPoints,
      spentPoints,
      newCustomers: newCustomersCount,
      totalTransactions: txs.length
    };
  }

  /**
   * Kampanya tarihlerini günceller ve çakışmaları engeller.
   */
  async updateCampaignDates(campaignId: string, branchId: string, startDate: Date, endDate: Date) {
    if (startDate >= endDate) {
      throw new Error("Kampanya başlangıç tarihi bitiş tarihinden önce olmalıdır.");
    }
    
    await this.checkOverlap(branchId, startDate, endDate, campaignId);

    const [updated] = await this.db
      .update(campaigns)
      .set({
        startDate,
        endDate,
        updatedAt: new Date(),
      })
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.branchId, branchId)))
      .returning();

    if (!updated) {
      throw new Error("Kampanya güncellenemedi veya bulunamadı.");
    }

    return updated;
  }

  /**
   * Kampanyanın detaylarını (isim, oran, kademeler, tarihler, açıklama) günceller.
   */
  async updateCampaignDetails(campaignId: string, branchId: string, input: Partial<CreateCampaignInput>) {
    if (input.startDate && input.endDate) {
      if (input.startDate >= input.endDate) {
        throw new Error("Kampanya başlangıç tarihi bitiş tarihinden önce olmalıdır.");
      }
      await this.checkOverlap(branchId, input.startDate, input.endDate, campaignId);
    }

    if (input.campaignType === "multiplier" && input.earnRatio !== undefined && (input.earnRatio <= 0 || input.earnRatio > 100)) {
      throw new Error("Kampanya kazanım oranı 1 ile 100 arasında olmalıdır.");
    }
    
    if (input.campaignType === "tiered" && input.tiers !== undefined) {
      if (!input.tiers || (Array.isArray(input.tiers) && input.tiers.length === 0) || (typeof input.tiers === "string" && (input.tiers.trim() === "[]" || input.tiers === ""))) {
        throw new Error("Kademeli kampanyalarda en az 1 kademe girilmelidir.");
      }
    }

    const [updated] = await this.db
      .update(campaigns)
      .set({
        name: input.name,
        campaignType: input.campaignType,
        earnRatio: input.earnRatio,
        tiers: input.tiers,
        startDate: input.startDate,
        endDate: input.endDate,
        description: input.description,
        updatedAt: new Date(),
      })
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.branchId, branchId)))
      .returning();

    if (!updated) {
      throw new Error("Kampanya güncellenemedi veya bulunamadı.");
    }

    return updated;
  }
  /**
   * Belirli bir organizasyondaki pasif müşterileri döner.
   */
  async getInactiveCustomers(orgId: string, thresholdDays: number) {
    const cutoff = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);
    return await this.db.select().from(customers)
      .where(and(
        eq(customers.organizationId, orgId),
        or(lt(customers.lastActiveAt, cutoff), isNull(customers.lastActiveAt))
      )).all();
  }

  /**
   * Kampanyayı ID ile getirir.
   */
  async getCampaignById(campaignId: string) {
    const campaign = await this.db
      .select({
        id: campaigns.id,
        branchId: campaigns.branchId,
        inactivityThresholdDays: campaigns.inactivityThresholdDays,
        orgId: branches.orgId
      })
      .from(campaigns)
      .innerJoin(branches, eq(campaigns.branchId, branches.id))
      .where(eq(campaigns.id, campaignId))
      .get();
      
    return campaign ?? null;
  }
}

export const campaignService = new CampaignService();
