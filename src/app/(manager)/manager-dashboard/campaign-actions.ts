"use server";

import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, branches, campaigns, campaignSends } from "@/db/schema";
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

  return { dbUser, branchId };
}

// ─── ACTIONS ─────────────────────────────────────────────────────────────────

/**
 * Yeni kampanya oluştur.
 */
export async function createCampaignAction(data: {
  name: string;
  earnRatio: number;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  description?: string;
}) {
  try {
    const { dbUser, branchId } = await resolveManagerContext();

    const campaign = await campaignService.createCampaign({
      branchId,
      createdBy: dbUser.id,
      name: data.name.trim(),
      earnRatio: data.earnRatio,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      description: data.description?.trim(),
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
    const { branchId } = await resolveManagerContext();
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
    const { branchId } = await resolveManagerContext();
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
    const { branchId } = await resolveManagerContext();
    await campaignService.deactivateCampaign(campaignId, branchId);
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

    const { branchId } = await resolveManagerContext();

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
    const { branchId } = await resolveManagerContext();
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
    const { branchId } = await resolveManagerContext();
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
    const { branchId } = await resolveManagerContext();
    const updated = await campaignService.updateCampaignDates(
      campaignId,
      branchId,
      new Date(startDate),
      new Date(endDate)
    );
    return { success: true, campaign: updated };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Kampanya tarihleri güncellenemedi.";
    return { success: false, error: message };
  }
}

/**
 * Pasif müşterilere kampanya gönderim kuyruğuna (pending) ekle.
 */
export async function sendCampaignToInactiveCustomersAction(campaignId: string) {
  try {
    const { branchId } = await resolveManagerContext();
    
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

