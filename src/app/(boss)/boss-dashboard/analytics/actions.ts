"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { staffService } from "@/lib/services/staff-service";
import { analyticsService } from "@/lib/services/analytics-service";

export interface AnalyticsResponse {
  success: boolean;
  analytics?: {
    totalPointsEarned: number;
    totalPointsBurned: number;
    totalRevenueInKurus: number;
    totalTransactions: number;
    chartData: {
      date: string;
      pointsEarned: number;
      pointsBurned: number;
      revenue: number;
    }[];
  };
  error?: string;
}

/**
 * Boss Dashboard Analitik Sunucu Eylemi (Server Action)
 * - Multi-Tenant İzolasyon Muhafızı: Boss rolü ve şube erişim yetkisini teyit eder.
 * - Seçilen dinamik tarih aralığına göre Unix zaman damgası hesaplar ve analitik servise iletir.
 * - Recharts grafik motorunu besleyecek gün bazlı zaman serisini (chartData) döner.
 */
export async function getFilteredAnalyticsAction(
  branchId: string,
  range: "today" | "7days" | "30days"
): Promise<AnalyticsResponse> {
  try {
    // 1. Kimlik Doğrulama
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Oturum bulunamadı. Lütfen giriş yapın.");
    }

    // 2. Boss Yetki Kontrolü
    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .get();

    if (!dbUser) {
      throw new Error("Kullanıcı kaydı bulunamadı.");
    }

    if (dbUser.role !== "BOSS" && dbUser.role !== "SUPER_ADMIN") {
      throw new Error("Bu işlemi gerçekleştirmek için yetkiniz bulunmamaktadır.");
    }

    // 3. Multi-Tenant Hiyerarşik Veri İzolasyon Kontrolü
    await staffService.requireBranchAccess(dbUser.id, dbUser.role, branchId);

    // 4. Dinamik Unix Zaman Damgası (Timestamp) Hesabı (Europe/Istanbul)
    const now = new Date();
    
    // Turkey permanent UTC+3 offset calculation
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const parts = formatter.formatToParts(now);
    const year = Number(parts.find(p => p.type === "year")?.value);
    const month = Number(parts.find(p => p.type === "month")?.value);
    const day = Number(parts.find(p => p.type === "day")?.value);

    // Start of today in Turkey (UTC+3)
    const startOfToday = new Date(Date.UTC(year, month - 1, day) - 3 * 60 * 60 * 1000);

    let startDate: number;
    const endDate = now.getTime();

    switch (range) {
      case "today":
        startDate = startOfToday.getTime();
        break;
      case "7days":
        startDate = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        break;
      case "30days":
        startDate = now.getTime() - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        throw new Error("Geçersiz zaman aralığı parametresi.");
    }

    // 5. Analitik Sorgusunu Tetikle
    const data = await analyticsService.getBranchAnalytics(branchId, startDate, endDate);

    return {
      success: true,
      analytics: data,
    };
  } catch (error: unknown) {
    console.error("[getFilteredAnalyticsAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Analitik verileri yüklenirken hata oluştu.",
    };
  }
}
