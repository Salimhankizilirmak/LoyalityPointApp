"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getBossProfile() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) throw new Error("Yetkisiz erişim");

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const org = await client.organizations.getOrganization({ organizationId: orgId });

  let pointRate = 10;
  let validityMonths = 12;
  try {
    const dbOrg = await db.select().from(organizations).where(eq(organizations.id, orgId)).get();
    if (dbOrg) {
      pointRate = dbOrg.pointRate;
      validityMonths = dbOrg.validityMonths;
    }
  } catch {
    // DB bağlantı hatası - default değerler
  }

  return {
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.emailAddresses[0]?.emailAddress || "",
      imageUrl: user.imageUrl,
    },
    org: {
      id: orgId,
      name: org.name,
      slug: org.slug || "",
      pointRate,
      validityMonths,
    },
  };
}

export async function updateOrgSettings(pointRate: number, validityMonths: number) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) throw new Error("Yetkisiz erişim");

  const client = await clerkClient();
  const membership = await client.organizations.getOrganizationMembershipList({ organizationId: orgId });
  const userMembership = membership.data.find(m => m.publicUserData?.userId === userId);
  if (userMembership?.role !== "org:admin") {
    throw new Error("Sadece patron bu ayarları değiştirebilir");
  }

  try {
    const existing = await db.select().from(organizations).where(eq(organizations.id, orgId)).get();
    if (existing) {
      await db.update(organizations).set({ pointRate, validityMonths }).where(eq(organizations.id, orgId));
    } else {
      const org = await client.organizations.getOrganization({ organizationId: orgId });
      const user = await client.users.getUser(userId);
      await db.insert(organizations).values({
        id: orgId,
        name: org.name,
        slug: org.slug || orgId,
        bossEmail: user.emailAddresses[0]?.emailAddress || "",
        pointRate,
        validityMonths,
      });
    }
  } catch {
    // DB hatası
  }

  return { success: true };
}

export async function createBranch(name: string, city: string) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) throw new Error("Yetkisiz erişim");

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const bossEmail = user.emailAddresses[0]?.emailAddress || "";

  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    + "-" + Date.now().toString(36);

  const newOrg = await client.organizations.createOrganization({
    name,
    slug,
    createdBy: userId,
  });

  try {
    await db.insert(organizations).values({
      id: newOrg.id,
      name,
      slug,
      bossEmail,
    });
  } catch {
    // DB hatası
  }

  return { success: true, id: newOrg.id, name, city };
}

// Clerk'ten organizasyondaki tüm üyeleri + bekleyen davetleri çek
export async function getOrgMembers() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) throw new Error("Yetkisiz erişim");

  const client = await clerkClient();

  // 1. Aktif üyeler
  const memberships = await client.organizations.getOrganizationMembershipList({
    organizationId: orgId,
    limit: 100,
  });

  const activeMembers = await Promise.all(
    memberships.data.map(async (m) => {
      const uid = m.publicUserData?.userId;
      if (!uid) return null;
      try {
        const u = await client.users.getUser(uid);
        const meta = (u.publicMetadata || {}) as Record<string, unknown>;
        let appRole: "boss" | "manager" | "cashier" = "cashier";
        if (m.role === "org:admin") {
          appRole = "boss";
        } else if (meta.role === "manager") {
          appRole = "manager";
        }

        return {
          id: uid,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.emailAddresses[0]?.emailAddress || "?",
          email: u.emailAddresses[0]?.emailAddress || "",
          role: appRole,
          avatar: `${(u.firstName || "?")[0]}${(u.lastName || "?")[0]}`.toUpperCase(),
          status: "active" as const,
        };
      } catch {
        return null;
      }
    })
  );

  // 2. Bekleyen davetler
  let pendingInvites: {
    id: string;
    name: string;
    email: string;
    role: "boss" | "manager" | "cashier";
    avatar: string;
    status: "pending";
  }[] = [];

  try {
    const invitations = await client.organizations.getOrganizationInvitationList({
      organizationId: orgId,
      status: ["pending"],
    });

    pendingInvites = invitations.data.map((inv) => {
      const email = inv.emailAddress || "";
      return {
        id: `invite-${inv.id}`,
        name: email.split("@")[0],
        email,
        role: "cashier" as const, // default, metadata sonra ayarlanacak
        avatar: email.charAt(0).toUpperCase() + "?",
        status: "pending" as const,
      };
    });
  } catch {
    // Davet listesi alınamadı
  }

  const result = [
    ...activeMembers.filter(Boolean),
    ...pendingInvites,
  ];

  return result as {
    id: string;
    name: string;
    email: string;
    role: "boss" | "manager" | "cashier";
    avatar: string;
    status: "active" | "pending";
  }[];
}

// Yönetici/Kasiyer davet et
export async function inviteEmployee(data: {
  name: string;
  email: string;
  role: "manager" | "cashier";
  branch: string;
}) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) throw new Error("Yetkisiz erişim");

  const client = await clerkClient();

  // Zaten üye mi kontrol et
  const memberships = await client.organizations.getOrganizationMembershipList({
    organizationId: orgId,
  });
  const alreadyMember = memberships.data.some(
    (m) => m.publicUserData?.identifier === data.email
  );
  if (alreadyMember) {
    throw new Error("Bu e-posta zaten organizasyonda kayıtlı.");
  }

  // Bekleyen davet var mı kontrol et
  try {
    const invitations = await client.organizations.getOrganizationInvitationList({
      organizationId: orgId,
      status: ["pending"],
    });
    const alreadyInvited = invitations.data.some(
      (inv) => inv.emailAddress === data.email
    );
    if (alreadyInvited) {
      throw new Error("Bu e-postaya zaten bir davet gönderilmiş.");
    }
  } catch (err) {
    if (err instanceof Error && (err.message.includes("zaten") || err.message.includes("davet"))) {
      throw err;
    }
    // Diğer hatalar sessizce geçilsin
  }

  // Davet gönder
  try {
    await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: data.email,
      inviterUserId: userId,
      role: "org:member",
    });
  } catch (err: unknown) {
    const error = err as { errors?: { code?: string; longMessage?: string }[] };
    const clerkError = error.errors?.[0];
    if (clerkError?.code === "already_a_member_in_organization") {
      throw new Error("Bu e-posta zaten organizasyonda kayıtlı.");
    }
    if (clerkError?.code === "organization_membership_quota_exceeded") {
      throw new Error("Organizasyon üye limiti doldu. Clerk planınızı yükseltin veya mevcut davetleri iptal edin.");
    }
    throw new Error(clerkError?.longMessage || "Davet gönderilemedi.");
  }

  // Metadata ayarla (varsa)
  try {
    const users = await client.users.getUserList({ emailAddress: [data.email] });
    if (users.data.length > 0) {
      await client.users.updateUserMetadata(users.data[0].id, {
        publicMetadata: { role: data.role, branch: data.branch },
      });
    }
  } catch {
    // Kullanıcı henüz kayıtlı değil
  }

  return { success: true, email: data.email, role: data.role };
}
