"use server";

import { db } from "@/db";
import { invitations, branches, users, staffProfiles, organizations } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";
import { emailService } from "@/lib/services/email-service";
import { getEmployeeInvitationTemplate, getCustomerInvitationTemplate } from "@/lib/templates/email-templates";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

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

export async function updateInvitationEmailAction(invitationId: string, newEmail: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Yetkisiz işlem.");

    const dbUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();
    if (!dbUser) throw new Error("Kullanıcı kaydı bulunamadı.");

    if (!["BOSS", "MANAGER", "CASHIER"].includes(dbUser.role)) {
       throw new Error("Bu işlem için yetkiniz yok.");
    }

    const invite = await db.select().from(invitations).where(eq(invitations.id, invitationId)).get();
    if (!invite) throw new Error("Davet bulunamadı.");
    if (invite.status !== "PENDING") throw new Error("Sadece 'Bekleyen' (PENDING) statüsündeki davetler güncellenebilir.");

    const org = await db.select().from(organizations).where(eq(organizations.id, invite.organizationId)).get();
    if (!org) throw new Error("Organizasyon bulunamadı.");

    // E-posta benzersizlik kontrolü (kayıtlı bir kullanıcı var mı?)
    const existingUser = await db.select().from(users).where(eq(users.email, newEmail.toLowerCase().trim())).get();
    if (existingUser) {
       throw new Error("Bu e-posta adresine sahip kayıtlı bir kullanıcı zaten var.");
    }

    // 1. Clerk Eski Daveti Revoke
    if (invite.clerkInviteId) {
      try {
        await clerkClient.invitations.revokeInvitation(invite.clerkInviteId);
      } catch (err) {
        console.log("[updateInvitationEmailAction] Clerk revoke hatası:", err);
      }
    }

    // 2. Yeni e-postayla Clerk Daveti oluştur
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const redirectUrl = `${appUrl}/sign-up`;
    
    const newInvite = await clerkClient.invitations.createInvitation({
      emailAddress: newEmail.toLowerCase().trim(),
      publicMetadata: { 
        role: invite.role.toLowerCase(), 
        orgId: invite.organizationId 
      },
      redirectUrl,
      ignoreExisting: true,
      notify: false,
    });

    if (!newInvite.url) {
      throw new Error("Yeni davet URL'si Clerk üzerinden oluşturulamadı.");
    }

    // 3. Veritabanını güncelle
    await db.update(invitations)
      .set({ email: newEmail.toLowerCase().trim(), clerkInviteId: newInvite.id })
      .where(eq(invitations.id, invitationId));

    // 4. Yeni maili yolla
    let html = "";
    if (invite.role === "CUSTOMER") {
        html = getCustomerInvitationTemplate(newInvite.url, invite.customerName || "Müşteri", org.name);
    } else {
        html = getEmployeeInvitationTemplate(newInvite.url, invite.role === "MANAGER" ? "manager" : "cashier", org.name);
    }

    await emailService.sendMail({
      to: newEmail.toLowerCase().trim(),
      subject: `${org.name} - Güncel Davet Linki`,
      html
    }).catch(err => console.error("[updateInvitationEmailAction] Email send err", err));

    return { success: true };
  } catch (error: any) {
    console.error("[updateInvitationEmailAction] Hata:", error);
    return { error: error.message || "Bilinmeyen bir hata oluştu." };
  }
}
