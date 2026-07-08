import { BaseService } from "./base-service";
import { loyaltyTransactions } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export class AnalyticsService extends BaseService {
  async getBranchAnalytics(
    branchId: string,
    startDate?: number,
    endDate?: number
  ) {
    const conditions = [
      eq(loyaltyTransactions.branchId, branchId),
      eq(loyaltyTransactions.status, "SUCCESS"),
      sql`${loyaltyTransactions.type} != 'VOID'`
    ];

    if (startDate !== undefined) {
      conditions.push(gte(loyaltyTransactions.createdAt, new Date(startDate)));
    }
    if (endDate !== undefined) {
      conditions.push(lte(loyaltyTransactions.createdAt, new Date(endDate)));
    }

    const queryCondition = and(...conditions);

    // 1. Single-Pass Günlük Zaman Serisi Sorgusu (Tüm data ms kabul edilir)
    const chartDataResult = await this.db
      .select({
        date: sql<string>`strftime('%Y-%m-%d', ${loyaltyTransactions.createdAt} + 10800, 'unixepoch')`,
        pointsEarned: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyTransactions.type} = 'EARN' THEN ${loyaltyTransactions.pointsAmount} ELSE 0 END), 0)`,
        pointsBurned: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyTransactions.type} = 'BURN' THEN ${loyaltyTransactions.pointsAmount} ELSE 0 END), 0)`,
        revenue: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyTransactions.type} = 'EARN' THEN ${loyaltyTransactions.amountSpent} ELSE 0 END), 0)`,
        transactionCount: sql<number>`COUNT(${loyaltyTransactions.id})`,
      })
      .from(loyaltyTransactions)
      .where(queryCondition)
      .groupBy(sql`strftime('%Y-%m-%d', ${loyaltyTransactions.createdAt} + 10800, 'unixepoch')`)
      .orderBy(sql`strftime('%Y-%m-%d', ${loyaltyTransactions.createdAt} + 10800, 'unixepoch')`)
      .all();

    // 2. Data Padding (Eksik günleri 0 ile doldurma)
    const dataMap = new Map();
    if (chartDataResult) {
      for (const row of chartDataResult) {
        dataMap.set(row.date, row);
      }
    }

    const paddedChartData = [];
    let startMs = startDate;
    let endMs = endDate || Date.now();

    // Eger hic parametre verilmemisse (veya veritabanından hic data gelmemisse) bos donmesin diye
    // en azindan son 7 gunu dolduralım (eger startDate undefined ise)
    if (!startMs) {
      startMs = endMs - (6 * 24 * 60 * 60 * 1000);
    }

    const current = new Date(startMs);
    current.setHours(0,0,0,0);
    const end = new Date(endMs);
    end.setHours(23,59,59,999);

    while (current <= end) {
      // Local time format (YYYY-MM-DD)
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      if (dataMap.has(dateStr)) {
        paddedChartData.push(dataMap.get(dateStr));
      } else {
        paddedChartData.push({
          date: dateStr,
          pointsEarned: 0,
          pointsBurned: 0,
          revenue: 0,
          transactionCount: 0
        });
      }
      current.setDate(current.getDate() + 1);
    }

    let totalPointsEarned = 0;
    let totalPointsBurned = 0;
    let totalRevenueInKurus = 0;
    let totalTransactions = 0;

    for (const day of paddedChartData) {
      totalPointsEarned += day.pointsEarned;
      totalPointsBurned += day.pointsBurned;
      totalRevenueInKurus += day.revenue;
      totalTransactions += day.transactionCount;
    }

    return {
      totalPointsEarned,
      totalPointsBurned,
      totalRevenueInKurus,
      totalTransactions,
      chartData: paddedChartData,
    };
  }
}

export const analyticsService = new AnalyticsService();
