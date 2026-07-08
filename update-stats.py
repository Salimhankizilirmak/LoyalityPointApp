import re

file_path = "src/app/(cashier)/cashier-dashboard/actions.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# getCashierStatsAction icindeki totalTxResult kismindan sonra ptsBurned hesaplamasini ekleyelim.
old_stats = """    // c) Toplam yaptığı işlem sayısı veya tutarı (totalTx)
    const totalTxResult = await db
      .select({
        count: sql<number>`count(${loyaltyTransactions.id})`,
        revenue: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyTransactions.type} = 'EARN' THEN ${loyaltyTransactions.amountSpent} ELSE 0 END), 0)`
      })
      .from(loyaltyTransactions)
      .where(
        and(
          eq(loyaltyTransactions.cashierId, dbUser.id),
          eq(loyaltyTransactions.branchId, branchId)
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
      }
    };"""

new_stats = """    // c) Toplam yaptığı işlem sayısı veya tutarı (totalTx)
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

content = content.replace(old_stats, new_stats)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

