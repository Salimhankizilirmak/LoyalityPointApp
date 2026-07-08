"use server";

import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, branches, campaigns, campaignSends, activityLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { campaignService } from "@/lib/services/campaign-service";

// ─── SHARED HELPERS ──────────────────────────────────────────────────────────

async function resolveManagerContext() {
  const { userId } = await auth();
  if (!userId) throw new Error("Oturum bulunamadı.");

  const dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();
  if (!dbUser) throw new Error("Kullanıcı kaydı bulunamadı.");
  if (dbUser.role !== "MANAGER" && dbUser.role !== "BOSS" && dbUser.role !== "SUPER_ADMIN") {
    throw new Error("Bu işlem için yönetici yetkisi gereklidir.");
  }

  const cookieStore = await cookies();
  const branchId = cookieStore.get("active_branch_id")?.value;
  if (!branchId) throw new Error("Aktif şube bağlamı bulunamadı.");

  const branchObj = await db.select({ orgId: branches.orgId }).from(branches).where(eq(branches.id, branchId)).get();
  if (!branchObj) throw new Error("Şube veritabanında bulunamadı.");

  return { dbUser, branchId, orgId: branchObj.orgId };
}

// ─── ACTIONS ─────────────────────────────────────────────────────────────────

/**
 * Yeni kampanya oluştur.
 */
export async function createCampaignAction(data: {
  name: string;
  campaignType: "multiplier" | "tiered";
  earnRatio: number;
  tiers?: any | null;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  description?: string;
}) {
  try {
    const { dbUser, branchId, orgId } = await resolveManagerContext();

    const campaign = await campaignService.createCampaign({
      branchId,
      createdBy: dbUser.id,
      name: data.name.trim(),
      campaignType: data.campaignType,
      earnRatio: data.earnRatio,
      tiers: data.tiers,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      description: data.description?.trim(),
    });

    await db.insert(activityLogs).values({
      orgId,
      type: "system",
      actorName: dbUser.name || dbUser.email,
      actorRole: dbUser.role,
      targetName: `Kampanya: ${data.name.trim()}`,
      description: `Yeni kampanya oluşturuldu. Tip: ${data.campaignType}, Kazanım: ${data.campaignType === "multiplier" ? "%" + data.earnRatio : "Kademeli Limite Göre"}`,
      metadata: JSON.stringify(data)
    });

    return { success: true, campaign };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Kampanya oluşturulamadı.";
    return { success: false, error: message };
  }
}

/**
 * Şubenin tüm kampanyalarını listele.
 */
export async function getCampaignsAction() {
  try {
    const { branchId, dbUser, orgId } = await resolveManagerContext();
    const list = await campaignService.getCampaignsByBranch(branchId);
    return { success: true, campaigns: list };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Kampanyalar yüklenemedi.";
    return { success: false, error: message, campaigns: [] };
  }
}

/**
 * Aktif kampanyayı getir.
 */
export async function getActiveCampaignAction() {
  try {
    const { branchId, dbUser, orgId } = await resolveManagerContext();
    const campaign = await campaignService.getActiveCampaignForBranch(branchId);
    return { success: true, campaign };
  } catch (error: unknown) {
    return { success: false, error: "Kampanya bilgisi alınamadı.", campaign: null };
  }
}

/**
 * Kampanyayı sonlandır.
 */
export async function deactivateCampaignAction(campaignId: string) {
  try {
    const { branchId, dbUser, orgId } = await resolveManagerContext();
    await campaignService.deactivateCampaign(campaignId, branchId);
    await db.insert(activityLogs).values({
      orgId,
      type: "system",
      actorName: dbUser.name || dbUser.email,
      actorRole: dbUser.role,
      targetName: `Kampanya ID: ${campaignId.slice(-6)}`,
      description: `Kampanya manuel olarak sonlandırıldı/deaktif edildi.`
    });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Kampanya sonlandırılamadı.";
    return { success: false, error: message };
  }
}

/**
 * Şubenin varsayılan kazanım oranını güncelle.
 */
export async function updateBranchEarnRatioAction(earnRatio: number) {
  try {
    if (earnRatio <= 0 || earnRatio > 100) {
      return { success: false, error: "Kazanım oranı 1 ile 100 arasında olmalıdır." };
    }

    const { branchId, dbUser, orgId } = await resolveManagerContext();

    await db
      .update(branches)
      .set({ defaultEarnRatio: earnRatio })
      .where(eq(branches.id, branchId));

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Oran güncellenemedi.";
    return { success: false, error: message };
  }
}

/**
 * Şubenin mevcut defaultEarnRatio değerini getir.
 */
export async function getBranchEarnRatioAction() {
  try {
    const { branchId, dbUser, orgId } = await resolveManagerContext();
    const branch = await db
      .select({ defaultEarnRatio: branches.defaultEarnRatio })
      .from(branches)
      .where(eq(branches.id, branchId))
      .get();

    return { success: true, earnRatio: branch?.defaultEarnRatio ?? 10 };
  } catch (error: unknown) {
    return { success: false, error: "Oran bilgisi alınamadı.", earnRatio: 10 };
  }
}

/**
 * Kampanya analiz verilerini getirir.
 */
export async function getCampaignAnalyticsAction(campaignId: string) {
  try {
    const { branchId, dbUser, orgId } = await resolveManagerContext();
    const analytics = await campaignService.getCampaignAnalytics(campaignId, branchId);
    return { success: true, analytics };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Kampanya istatistikleri alınamadı.";
    return { success: false, error: message };
  }
}

/**
 * Kampanya tarihlerini günceller.
 */
export async function updateCampaignDatesAction(campaignId: string, startDate: string, endDate: string) {
  try {
    const { branchId, dbUser, orgId } = await resolveManagerContext();
    const updated = await campaignService.updateCampaignDates(
      campaignId,
      branchId,
      new Date(startDate),
      new Date(endDate)
    );
    await db.insert(activityLogs).values({
      orgId,
      type: "system",
      actorName: dbUser.name || dbUser.email,
      actorRole: dbUser.role,
      targetName: `Kampanya: ${updated.name}`,
      description: `Kampanya tarihleri güncellendi. Yeni Başlangıç: ${new Date(startDate).toLocaleDateString('tr-TR')}, Yeni Bitiş: ${new Date(endDate).toLocaleDateString('tr-TR')}`
    });
    return { success: true, campaign: updated };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Kampanya tarihleri güncellenemedi.";
    return { success: false, error: message };
  }
}

/**
 * Kampanya tüm detaylarını günceller.
 */
export async function updateCampaignDetailsAction(
  campaignId: string,
  data: {
    name?: string;
    campaignType?: "multiplier" | "tiered";
    earnRatio?: number;
    tiers?: any;
    startDate?: string;
    endDate?: string;
    description?: string;
  }
) {
  try {
    const { branchId, dbUser, orgId } = await resolveManagerContext();
    const payload: any = { ...data };
    if (payload.startDate) payload.startDate = new Date(payload.startDate);
    if (payload.endDate) payload.endDate = new Date(payload.endDate);

    const updated = await campaignService.updateCampaignDetails(campaignId, branchId, payload);
    await db.insert(activityLogs).values({
      orgId,
      type: "system",
      actorName: dbUser.name || dbUser.email,
      actorRole: dbUser.role,
      targetName: `Kampanya: ${updated.name}`,
      description: `Kampanya detayları (isim, tip, oran/limit vb.) güncellendi.`,
      metadata: JSON.stringify(payload)
    });
    return { success: true, campaign: updated };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Kampanya güncellenemedi.";
    return { success: false, error: message };
  }
}

/**
 * Pasif müşterilere kampanya gönderim kuyruğuna (pending) ekle.
 */
export async function sendCampaignToInactiveCustomersAction(campaignId: string) {
  try {
    const { branchId, dbUser, orgId } = await resolveManagerContext();
    
    const campaign = await campaignService.getCampaignById(campaignId);
    if (!campaign) return { success: false, error: "Kampanya bulunamadı." };
    
    // Güvenlik Kontrolü: Kampanyanın bu şubeye ait olup olmadığını denetle
    if (campaign.branchId !== branchId) {
      return { success: false, error: "Yetkisiz işlem: Kampanya bu şubeye ait değil." };
    }

    const inactive = await campaignService.getInactiveCustomers(campaign.orgId, campaign.inactivityThresholdDays);
    if (inactive.length === 0) return { success: false, error: "Bu kritere uyan pasif müşteri bulunamadı." };

    const rows = inactive.map((c) => ({
      id: crypto.randomUUID(),
      campaignId,
      customerId: c.id,
      status: "pending" as const,
      createdAt: new Date(),
    }));

    await db.insert(campaignSends).values(rows).onConflictDoNothing();

    return { success: true, queued: rows.length };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gönderim kuyruğuna eklenirken hata oluştu.";
    return { success: false, error: message };
  }
}

