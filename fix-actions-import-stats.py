import re

file_path = "src/app/(cashier)/cashier-dashboard/actions.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add loyaltyRules to import
if "loyaltyRules" not in content[:500]:
    content = content.replace("campaigns } from", "campaigns, loyaltyRules } from")

# 2. Modify getCashierStatsAction to get orgId and fetch rules
old_stats = """export async function getCashierStatsAction() {
  try {
    const { dbUser, branchId } = await resolveCashierContext();"""

new_stats = """export async function getCashierStatsAction() {
  try {
    const { dbUser, branchId, orgId } = await resolveCashierContext();"""

content = content.replace(old_stats, new_stats)

old_return = """    // c) Toplam yaptığı işlem sayısı veya tutarı (totalTx)
    const totalTxResult = await db
      .select({
        count: sql<number>`count(${loyaltyTransactions.id})`,
        revenue: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyTransactions.type} = 'EARN' THEN ${loyaltyTransactions.pointsAmount} ELSE 0 END), 0)`,
        burned: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyTransactions.type} = 'BURN' THEN ${loyaltyTransactions.pointsAmount} ELSE 0 END), 0)`
      })
      .from(loyaltyTransactions)
      .where(
        and(
          eq(loyaltyTransactions.cashierId, dbUser.id),
          eq(loyaltyTransactions.branchId, branchId),
          gte(loyaltyTransactions.createdAt, startOfToday)
        )
      )
      .get();

    return {
      success: true,
      stats: {
        todayTxCount: todayTxCountResult?.count || 0,
        todayNewCustomers: todayNewCustomersResult?.count || 0,
        totalTxCount: totalTxResult?.count || 0,
        totalRevenue: totalTxResult?.revenue || 0,
        totalBurned: totalTxResult?.burned || 0
      }
    };"""

new_return = """    // c) Toplam yaptığı işlem sayısı veya tutarı (totalTx)
    const totalTxResult = await db
      .select({
        count: sql<number>`count(${loyaltyTransactions.id})`,
        revenue: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyTransactions.type} = 'EARN' THEN ${loyaltyTransactions.pointsAmount} ELSE 0 END), 0)`,
        burned: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyTransactions.type} = 'BURN' THEN ${loyaltyTransactions.pointsAmount} ELSE 0 END), 0)`
      })
      .from(loyaltyTransactions)
      .where(
        and(
          eq(loyaltyTransactions.cashierId, dbUser.id),
          eq(loyaltyTransactions.branchId, branchId),
          gte(loyaltyTransactions.createdAt, startOfToday)
        )
      )
      .get();

    // d) Yönetici Puan Kuralları
    const loyaltyRule = await db
      .select({
        earnRatio: loyaltyRules.earnRatio,
        pointsEquivalent: loyaltyRules.pointsEquivalent,
        tlEquivalent: loyaltyRules.tlEquivalent,
      })
      .from(loyaltyRules)
      .where(eq(loyaltyRules.organizationId, orgId))
      .get();

    return {
      success: true,
      stats: {
        todayTxCount: todayTxCountResult?.count || 0,
        todayNewCustomers: todayNewCustomersResult?.count || 0,
        totalTxCount: totalTxResult?.count || 0,
        totalRevenue: totalTxResult?.revenue || 0,
        totalBurned: totalTxResult?.burned || 0,
        earnRatio: loyaltyRule?.earnRatio || 10,
        pointsEquivalent: loyaltyRule?.pointsEquivalent || 1,
        tlEquivalent: loyaltyRule?.tlEquivalent || 1
      }
    };"""

content = content.replace(old_return, new_return)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
