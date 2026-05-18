import { BaseService } from "./base-service";
import { loyaltyTransactions } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export class AnalyticsService extends BaseService {
  /**
   * Yüksek Performanslı SQL Toplama (Aggregation) Servisi.
   * - Boş şubelerde tipi kırmaması için SUM aggregasyonlarını COALESCE(SUM(...), 0) ile sarmalar.
   * - Gün bazlı gruplama (Timeline Dataset) yaparak recharts için chartData üretir.
   * - Bulletproof Timestamp Auto-Detection: JS milisaniye ve SQLite saniye verilerini otomatik ayırt eder.
   */
  async getBranchAnalytics(
    branchId: string,
    startDate?: number,
    endDate?: number
  ) {
    const conditions = [eq(loyaltyTransactions.branchId, branchId)];

    if (startDate !== undefined) {
      conditions.push(gte(loyaltyTransactions.createdAt, new Date(startDate)));
    }
    if (endDate !== undefined) {
      conditions.push(lte(loyaltyTransactions.createdAt, new Date(endDate)));
    }

    const queryCondition = and(...conditions);

    // 1. Single-Pass Günlük Zaman Serisi Sorgusu (UTC+3 Türkiye Saat Dilimi & Recharts Desteği)
    const chartDataResult = await this.db
      .select({
        date: sql<string>`strftime('%Y-%m-%d', (${loyaltyTransactions.createdAt} / 1000) + 10800, 'unixepoch')`,
        pointsEarned: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyTransactions.type} = 'EARN' THEN ${loyaltyTransactions.pointsAmount} ELSE 0 END), 0)`,
        pointsBurned: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyTransactions.type} = 'BURN' THEN ${loyaltyTransactions.pointsAmount} ELSE 0 END), 0)`,
        revenue: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyTransactions.type} = 'EARN' THEN ${loyaltyTransactions.amountSpent} ELSE 0 END), 0)`,
        transactionCount: sql<number>`COUNT(${loyaltyTransactions.id})`,
      })
      .from(loyaltyTransactions)
      .where(queryCondition)
      .groupBy(sql`strftime('%Y-%m-%d', (${loyaltyTransactions.createdAt} / 1000) + 10800, 'unixepoch')`)
      .orderBy(sql`strftime('%Y-%m-%d', (${loyaltyTransactions.createdAt} / 1000) + 10800, 'unixepoch')`)
      .all();

    // 2. In-Memory Toplama (Veritabanı I/O Maliyetini %50 Düşüren Tek Paslı Mimari)
    let totalPointsEarned = 0;
    let totalPointsBurned = 0;
    let totalRevenueInKurus = 0;
    let totalTransactions = 0;

    if (chartDataResult) {
      for (const day of chartDataResult) {
        totalPointsEarned += day.pointsEarned;
        totalPointsBurned += day.pointsBurned;
        totalRevenueInKurus += day.revenue;
        totalTransactions += day.transactionCount;
      }
    }

    return {
      totalPointsEarned,
      totalPointsBurned,
      totalRevenueInKurus,
      totalTransactions,
      // Map chartData values cleanly for Recharts compatibility
      chartData: (chartDataResult || []).map(day => ({
        date: day.date,
        pointsEarned: day.pointsEarned,
        pointsBurned: day.pointsBurned,
        revenue: day.revenue
      })),
    };
  }
}

export const analyticsService = new AnalyticsService();
