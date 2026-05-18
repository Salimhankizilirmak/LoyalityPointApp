import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, userBranches, branches } from "@/db/schema";
import { eq } from "drizzle-orm";

export type BranchOption = {
  id: string;
  name: string;
  city: string;
};

export type BranchContext = {
  activeBranchId: string;
  activeBranch: BranchOption;
  allBranches: BranchOption[];
  isMultiBranch: boolean;
};

/**
 * Server-Side Fallback ile aktif şube bağlamını çözer.
 * - Çerez boşsa, veritabanındaki ilk şubeyi otomatik aktif kabul eder.
 * - Cross-Org bulaşmasını önler: çerezdeki şubeyi org'a göre doğrular.
 */
export async function resolveActiveBranchContext(): Promise<BranchContext | null> {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return null;

  const dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();
  if (!dbUser) return null;

  // BOSS veya SUPER_ADMIN ise, junction tablosu yerine organizasyona ait şubeler alınır
  let availableBranches: BranchOption[] = [];

  if (dbUser.role === "SUPER_ADMIN" || dbUser.role === "BOSS") {
    const orgBranches = await db
      .select({ id: branches.id, name: branches.name, city: branches.city })
      .from(branches)
      .where(eq(branches.orgId, orgId))
      .all();
    availableBranches = orgBranches;
  } else {
    // MANAGER / CASHIER: junction tablosundan çek
    const junctionBranches = await db
      .select({ id: branches.id, name: branches.name, city: branches.city })
      .from(userBranches)
      .innerJoin(branches, eq(userBranches.branchId, branches.id))
      .where(eq(userBranches.userId, dbUser.id))
      .all();
    availableBranches = junctionBranches;
  }

  if (availableBranches.length === 0) return null;

  // Cookie'den aktif şubeyi al
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get("active_branch_id")?.value;

  let activeBranch: BranchOption | undefined;

  if (cookieVal) {
    // Cross-Org Cookie Cross-Contamination Guard
    activeBranch = availableBranches.find((b) => b.id === cookieVal);
    // Çerez personelin erişebildiği şubelerden birini işaret etmiyorsa sıfırla
    if (!activeBranch) {
      activeBranch = availableBranches[0];
    }
  } else {
    // Server-Side Fallback: ilk şubeyi otomatik aktif kabul et
    activeBranch = availableBranches[0];
  }

  return {
    activeBranchId: activeBranch.id,
    activeBranch,
    allBranches: availableBranches,
    isMultiBranch: availableBranches.length > 1,
  };
}
