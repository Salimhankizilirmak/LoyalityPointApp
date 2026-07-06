"use server";

import { db } from "@/db";
import { branches, organizations, users, loyaltyTransactions, invitations } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function getBossBranchesInfo() {
  const { userId } = await auth();
  if (!userId) throw new Error("Yetkisiz işlem. Lütfen giriş yapın.");

  const dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();
  if (!dbUser || dbUser.role !== "BOSS") throw new Error("Yetkisiz: Yalnızca patronlar erişebilir.");

  const org = await db.select().from(organizations).where(eq(organizations.bossId, dbUser.id)).get();
  if (!org) throw new Error("Organizasyon bulunamadı.");

  const orgBranches = await db.select({
    id: branches.id,
    name: branches.name,
    city: branches.city,
    isActive: branches.isActive,
    managerId: branches.managerId,
    managerName: users.name,
    managerEmail: users.email,
  })
  .from(branches)
  .leftJoin(users, eq(branches.managerId, users.id))
  .where(eq(branches.orgId, org.id))
  .all();

  return {
    branches: orgBranches,
    branchLimit: org.branchLimit,
    currentBranchCount: orgBranches.length
  };
}

export async function getBossAnalytics(
  filter: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM', 
  customStart?: Date, 
  customEnd?: Date
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Yetkisiz işlem. Lütfen giriş yapın.");

  const dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();
  if (!dbUser || dbUser.role !== "BOSS") throw new Error("Yetkisiz: Yalnızca patronlar erişebilir.");

  const org = await db.select().from(organizations).where(eq(organizations.bossId, dbUser.id)).get();
  if (!org) throw new Error("Organizasyon bulunamadı.");

  let startDate: Date;
  let endDate: Date = new Date();

  const now = new Date();
  
  switch(filter) {
    case 'TODAY':
      startDate = new Date(now.setHours(0,0,0,0));
      break;
    case 'WEEK':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'MONTH':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'YEAR':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    case 'CUSTOM':
      if (!customStart || !customEnd) throw new Error("Özel tarih aralığı için başlangıç ve bitiş tarihleri gereklidir.");
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      // Ensure time includes whole end day
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      startDate = new Date(now.setHours(0,0,0,0));
  }

  const stats = await db.select({
    totalTransactions: sql<number>`count(*)`,
    totalRevenue: sql<number>`sum(${loyaltyTransactions.amountSpent})`,
    branchId: loyaltyTransactions.branchId,
    branchName: branches.name,
  })
  .from(loyaltyTransactions)
  .leftJoin(branches, eq(loyaltyTransactions.branchId, branches.id))
  .where(and(
    eq(loyaltyTransactions.organizationId, org.id),
    gte(loyaltyTransactions.createdAt, startDate),
    lte(loyaltyTransactions.createdAt, endDate),
    eq(loyaltyTransactions.status, "SUCCESS")
  ))
  .groupBy(loyaltyTransactions.branchId, branches.name)
  .all();

  const totalTransactions = stats.reduce((acc, curr) => acc + curr.totalTransactions, 0);
  const totalRevenue = stats.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);

  return {
    totalTransactions,
    totalRevenue,
    branchComparisons: stats.map(s => ({
      branchId: s.branchId,
      branchName: s.branchName,
      transactions: s.totalTransactions,
      revenue: s.totalRevenue || 0
    }))
  };
}

export async function inviteManagerAction(email: string, name: string, branchId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Yetkisiz işlem. Lütfen giriş yapın.");

  if (!branchId) throw new Error("Yönetici daveti için şube seçimi zorunludur.");

  const dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();
  if (!dbUser || dbUser.role !== "BOSS") throw new Error("Yetkisiz: Yalnızca patronlar erişebilir.");

  const org = await db.select().from(organizations).where(eq(organizations.bossId, dbUser.id)).get();
  if (!org) throw new Error("Organizasyon bulunamadı.");

  const branch = await db.select().from(branches).where(eq(branches.id, branchId)).get();
  if (!branch || branch.orgId !== org.id) throw new Error("Geçersiz şube yetkisi.");

  const client = await clerkClient();

  const clerkInvite = await client.invitations.createInvitation({
    emailAddress: email,
    publicMetadata: {
      role: "MANAGER",
      orgId: org.id,
      branchId: branch.id,
      name: name
    },
    ignoreExisting: true,
  });

  await db.insert(invitations).values({
    clerkInviteId: clerkInvite.id,
    email: email,
    organizationId: org.id,
    branchId: branch.id,
    role: "MANAGER",
    status: "PENDING",
    invitedBy: dbUser.id,
  });

  return { success: true };
}
