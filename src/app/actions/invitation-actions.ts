"use server";

import { db } from "@/db";
import { invitations, branches, users, staffProfiles, organizations } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function getInvitationsAction(branchId?: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Yetkisiz işlem. Lütfen giriş yapın.");
    }

    // Get current local user
    const dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();
    if (!dbUser) {
      throw new Error("Kullanıcı kaydı bulunamadı.");
    }

    let resolvedOrgId: string | null = null;
    let resolvedBranchId: string | null = null;

    if (dbUser.role === "SUPER_ADMIN") {
      // Super admin can see all invitations or filter by organization if they have context.
      // But let's restrict to latest 10 overall for Super Admin to audit
      const list = await db.select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        status: invitations.status,
        createdAt: invitations.createdAt,
        branchName: branches.name,
      })
      .from(invitations)
      .leftJoin(branches, eq(invitations.branchId, branches.id))
      .orderBy(desc(invitations.createdAt))
      .limit(10)
      .all();

      return list;
    }

    if (dbUser.role === "BOSS") {
      // BOSS can see all invitations for their organization
      const org = await db.select().from(organizations).where(eq(organizations.bossId, dbUser.id)).get();
      if (org) {
        resolvedOrgId = org.id;
      }
    } else if (dbUser.role === "MANAGER") {
      // MANAGER can see invitations for their assigned branch
      const profile = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, dbUser.id)).get();
      if (profile) {
        resolvedBranchId = profile.branchId;
        const br = await db.select().from(branches).where(eq(branches.id, profile.branchId)).get();
        if (br) {
          resolvedOrgId = br.orgId;
        }
      }
    }

    if (!resolvedOrgId) {
      return [];
    }

    // Build the query
    const baseQuery = db.select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      status: invitations.status,
      createdAt: invitations.createdAt,
      branchName: branches.name,
    })
    .from(invitations)
    .leftJoin(branches, eq(invitations.branchId, branches.id));

    let list;
    
    if (branchId) {
      // Explicit branch filter (security check: must belong to the organization)
      const targetBranch = await db.select().from(branches).where(eq(branches.id, branchId)).get();
      if (!targetBranch || targetBranch.orgId !== resolvedOrgId) {
        throw new Error("Geçersiz şube yetkisi.");
      }
      
      list = await baseQuery
        .where(and(
          eq(invitations.branchId, branchId),
          eq(invitations.invitedBy, dbUser.id)
        ))
        .orderBy(desc(invitations.createdAt))
        .limit(10)
        .all();
    } else if (resolvedBranchId && dbUser.role === "MANAGER") {
      // Scoped manager branch invitations
      list = await baseQuery
        .where(and(
          eq(invitations.organizationId, resolvedOrgId),
          eq(invitations.branchId, resolvedBranchId),
          eq(invitations.invitedBy, dbUser.id)
        ))
        .orderBy(desc(invitations.createdAt))
        .limit(10)
        .all();
    } else {
      // General organization invitations for Boss
      list = await baseQuery
        .where(and(
          eq(invitations.organizationId, resolvedOrgId),
          eq(invitations.invitedBy, dbUser.id)
        ))
        .orderBy(desc(invitations.createdAt))
        .limit(10)
        .all();
    }

    return list;
  } catch (error) {
    console.error("[getInvitationsAction] Error fetching invitations:", error);
    return [];
  }
}
