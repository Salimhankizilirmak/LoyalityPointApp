import { BaseService } from "./base-service";
import { normalizePhoneToUsername, isValidTurkishPhone, sanitizePhoneTo10 } from "@/lib/utils";
import { users, customerProfiles, organizations, customers, invitations } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";

export class CustomerService extends BaseService {
  async syncCustomerData() {
    const session = await this.getSession();
    const user = await this.getCurrentUser();

    // Ensure users table record exists
    let dbUser = await this.db.select().from(users).where(eq(users.clerkId, session.userId!)).get();
    if (!dbUser) {
      const inserted = await this.db.insert(users).values({
        clerkId: session.userId!,
        email: user.primaryEmailAddress?.emailAddress || `no-email-${session.userId}@customer.com`,
        role: "CUSTOMER",
      }).returning();
      dbUser = inserted[0];
    }

    // JIT Self-Healing: Webhook gecikmesine karşı ilk girişte davetiye durumunu mühürle
    let inviteName = null;
    if (dbUser.email) {
      const existingInvite = await this.db.select().from(invitations).where(eq(invitations.email, dbUser.email.toLowerCase())).get();
      if (existingInvite) {
        if (existingInvite.customerName) inviteName = existingInvite.customerName;
        await this.db.update(invitations)
          .set({ status: "ACCEPTED" })
          .where(and(
            eq(invitations.email, dbUser.email.toLowerCase()),
            eq(invitations.status, "PENDING")
          ));
      }
    }

    const meta = (user.publicMetadata || {}) as Record<string, unknown>;
    
    // Resolve dynamic orgId without using explicit 'any'
    const sessionWithClaims = session as { sessionClaims?: { metadata?: { orgId?: string }; orgId?: string } };
    const sessionClaimsOrgId = sessionWithClaims.sessionClaims?.metadata?.orgId || sessionWithClaims.sessionClaims?.orgId;
    let orgId = session.orgId || (meta.org_id as string) || sessionClaimsOrgId;
    
    if (!orgId || orgId === "showcase") {
      orgId = "org_3ERbT8Zq2peIxRmL13y820AmHCO";
    }

    // Dynamic Organization Check & Dynamic Creation to prevent Foreign Key constraints
    let orgExists = await this.db.select().from(organizations).where(eq(organizations.id, orgId)).get();
    if (!orgExists) {
      console.log(`[syncCustomerData] Organization ${orgId} not found in DB. Creating dynamically to avoid constraint failures.`);
      const insertedOrg = await this.db.insert(organizations).values({
        id: orgId,
        name: "Varsayılan Organizasyon",
        isActive: true,
        status: "ACTIVE",
        branchLimit: 10,
      }).returning();
      orgExists = insertedOrg[0];
    }

    // Dynamic Customer Record Check
    const phoneFromMeta = (meta.phone as string) || "";
    let primaryPhone = user.phoneNumbers?.[0]?.phoneNumber || phoneFromMeta;
    
    // Ensure primaryPhone is never empty by using a dummy phone derived from email or userId
    if (!primaryPhone || primaryPhone.trim() === "") {
      const emailStr = dbUser.email || user.id;
      let hash = 0;
      for (let i = 0; i < emailStr.length; i++) {
        hash = emailStr.charCodeAt(i) + ((hash << 5) - hash);
      }
      const num = Math.abs(hash).toString().substring(0, 10).padEnd(10, "0");
      primaryPhone = `+90${num}`;
    }

    let customerRecord = null;
    const cleanPhone = primaryPhone.replace(/[\s+-]/g, "");
    customerRecord = await this.db.select().from(customers).where(eq(customers.phoneNumber, primaryPhone)).get();
    
    if (!customerRecord && cleanPhone) {
      const allCustomers = await this.db.select().from(customers).all();
      customerRecord = allCustomers.find(c => {
        const cClean = c.phoneNumber.replace(/[\s+-]/g, "");
        return cClean === cleanPhone || cClean.endsWith(cleanPhone) || cleanPhone.endsWith(cClean);
      }) || null;
    }

    // Dynamic customer creation if record does not exist
    if (!customerRecord) {
      console.log(`[syncCustomerData] Creating new root customer record for phone: ${primaryPhone}`);
      const insertedCustomer = await this.db.insert(customers).values({
        organizationId: orgId,
        phoneNumber: primaryPhone,
        name: inviteName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "İsimsiz Müşteri",
        totalPoints: 0,
      }).returning();
      customerRecord = insertedCustomer[0];
    }

    // Ensure customer_profiles table record exists
    let profile = await this.db.select().from(customerProfiles).where(eq(customerProfiles.userId, dbUser.id)).get();
    if (!profile) {
      console.log(`[syncCustomerData] Creating new root customer record for phone: ${primaryPhone}`);
      const insertedProfile = await this.db.insert(customerProfiles).values({
        userId: dbUser.id,
        orgId: orgId,
        currentPoints: customerRecord.totalPoints || 0,
        kvkkStatus: true,
        kvkkAcceptedAt: Date.now(),
      }).returning();
      profile = insertedProfile[0];
    } else {
      // Sync currentPoints with customers table totalPoints
      if (profile.currentPoints !== customerRecord.totalPoints || profile.orgId !== orgId) {
        await this.db.update(customerProfiles)
          .set({ 
            currentPoints: customerRecord.totalPoints,
            orgId: orgId
          })
          .where(eq(customerProfiles.id, profile.id));
        profile.currentPoints = customerRecord.totalPoints;
        profile.orgId = orgId;
      }
    }

    return {
      id: dbUser.id,
      clerkId: dbUser.clerkId,
      firstName: user.firstName || "İsimsiz",
      lastName: user.lastName || "Müşteri",
      phone: primaryPhone,
      email: dbUser.email,
      currentPoints: profile.currentPoints,
    };
  }

  async getCustomers(query?: string) {
    const orgId = await this.requireOrg();

    const result = await this.db.select({
      id: users.id,
      profileId: customerProfiles.id,
      clerkId: users.clerkId,
      email: users.email,
      username: users.username,
      currentPoints: customerProfiles.currentPoints,
    })
    .from(customerProfiles)
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .where(eq(customerProfiles.orgId, orgId))
    .all();

    const client = await this.getClerkClient();
    const enriched = await Promise.all(result.map(async (c) => {
      try {
        if (c.clerkId.startsWith("mock_")) {
          throw new Error("Mock user");
        }
        const u = await client.users.getUser(c.clerkId);
        const meta = (u.publicMetadata || {}) as Record<string, unknown>;
        return {
          id: c.id,
          profileId: c.profileId,
          clerkId: c.clerkId,
          firstName: u.firstName || "İsimsiz",
          lastName: u.lastName || "Müşteri",
          phone: c.username || (meta.phone as string) || "",
          email: c.email,
          currentPoints: c.currentPoints,
        };
      } catch {
        // Fetch user details from DB to get the name
        const dbUser = await this.db.select({ name: users.name, email: users.email, clerkId: users.clerkId, username: users.username })
          .from(users)
          .where(eq(users.id, c.id))
          .get();

        const phone = dbUser?.username || c.username || (dbUser?.clerkId.startsWith("mock_") ? dbUser.clerkId.replace("mock_", "") : "");
        const fullName = dbUser?.name || "";
        const parts = fullName.split(" ");
        const firstName = parts[0] || (dbUser?.email ? dbUser.email.split("@")[0] : "İsimsiz");
        const lastName = parts.slice(1).join(" ") || "Müşteri";

        return {
          id: c.id,
          profileId: c.profileId,
          clerkId: c.clerkId,
          firstName,
          lastName,
          phone,
          email: c.email,
          currentPoints: c.currentPoints,
        };
      }
    }));

    if (query) {
      const q = query.toLowerCase();
      return enriched.filter(e => 
        e.firstName.toLowerCase().includes(q) || 
        e.lastName.toLowerCase().includes(q) || 
        e.phone.includes(q) || 
        e.email.toLowerCase().includes(q)
      );
    }

    return enriched;
  }

  async updateCustomer(id: string, data: Partial<typeof customerProfiles.$inferInsert> & { firstName?: string, lastName?: string }) {
    await this.requireOrg();
    
    const profile = await this.db.select().from(customerProfiles).where(eq(customerProfiles.id, id)).get()
      || await this.db.select().from(customerProfiles).where(eq(customerProfiles.userId, id)).get();
      
    if (profile) {
      const { firstName, lastName, ...profileData } = data;
      
      // Update Name in Clerk & Users if provided
      if (firstName !== undefined || lastName !== undefined) {
         const userRec = await this.db.select().from(users).where(eq(users.id, profile.userId)).get();
         if (userRec) {
            const client = await this.getClerkClient();
            const currentClerkUser = await client.users.getUser(userRec.clerkId);
            const newFirst = firstName !== undefined ? firstName : currentClerkUser.firstName || "";
            const newLast = lastName !== undefined ? lastName : currentClerkUser.lastName || "";
            const computedName = `${newFirst} ${newLast}`.trim() || null;
            
            await client.users.updateUser(userRec.clerkId, {
               firstName: newFirst,
               lastName: newLast
            });
            
            await this.db.update(users).set({ name: computedName }).where(eq(users.id, profile.userId));
            
            // customers tablosundaki name'i de guncelle
            await this.db.update(customers).set({ name: computedName || "İsimsiz Müşteri" }).where(eq(customers.phoneNumber, userRec.username || ""));
         }
      }
      
      if (Object.keys(profileData).length > 0) {
        await this.db.update(customerProfiles).set(profileData as Partial<typeof customerProfiles.$inferInsert>).where(eq(customerProfiles.id, profile.id));
      }
    }
    return { success: true };
  }

  async deleteCustomer(id: string) {
    await this.requireOrg();
    
    const profile = await this.db.select().from(customerProfiles).where(eq(customerProfiles.id, id)).get()
      || await this.db.select().from(customerProfiles).where(eq(customerProfiles.userId, id)).get();
    
    if (profile) {
      await this.db.delete(customerProfiles).where(eq(customerProfiles.id, profile.id));
      await this.db.delete(users).where(eq(users.id, profile.userId));
    }
    return { success: true };
  }

  async inviteCustomer(data: { firstName: string; lastName: string; phone: string; email: string; branchId: string; orgId: string; invitedById: string }) {
    const client = await this.getClerkClient();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL environment variable is not set");
    }

    const cleanedPhone = sanitizePhoneTo10(data.phone);
    const normalizedPhone = normalizePhoneToUsername(data.phone);
    if (!isValidTurkishPhone(data.phone)) {
      throw new Error("Geçersiz telefon numarası formatı");
    }

    // Telefon numarası benzersizlik kontrolü (users.username)
    const existingUserByPhone = await this.db
      .select()
      .from(users)
      .where(eq(users.username, normalizedPhone))
      .get();
    if (existingUserByPhone) {
      throw new Error("PHONE_ALREADY_REGISTERED");
    }

    // Aktif davetiye çakışma kontrolü (organizasyon bazlı)
    const existingInviteByPhone = await this.db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.phoneNumber, cleanedPhone),
          eq(invitations.organizationId, data.orgId),
          or(eq(invitations.status, "PENDING"), eq(invitations.status, "ACCEPTED"))
        )
      )
      .get();
    if (existingInviteByPhone) {
      throw new Error("PHONE_INVITATION_EXISTS");
    }

    const invitation = await client.invitations.createInvitation({
      emailAddress: data.email,
      publicMetadata: { 
        firstName: data.firstName,
        lastName: data.lastName,
        phone: normalizedPhone,
        role: "customer",
        org_id: data.orgId,
      },
      redirectUrl: `${appUrl}/sign-up`,
      ignoreExisting: true,
      notify: false,
    });

    const org = await this.db.select().from(organizations).where(eq(organizations.id, data.orgId)).get();
    const orgName = org?.name || "Sadakat Platformu";

    const { emailService } = await import("@/lib/services/email-service");
    if (!invitation.url) {
      throw new Error("Davet bağlantısı oluşturulamadı.");
    }
    const { getCustomerInvitationTemplate } = await import("@/lib/templates/email-templates");
    const customerFullname = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();
    const html = getCustomerInvitationTemplate(
      invitation.url,
      customerFullname,
      orgName
    );

    await emailService.sendMail({
      to: data.email.trim().toLowerCase(),
      subject: `${orgName} Sadakat Programı Daveti`,
      html,
    }).catch((err) => {
      console.error("[EmailService] Müşteri davet e-postası gönderim hatası:", err);
    });

    // Başarılı davette yerel veritabanına gölge kayıt atılması
    await this.db.insert(invitations).values({
      clerkInviteId: invitation.id,
      email: data.email.trim().toLowerCase(),
      phoneNumber: cleanedPhone,
      customerName: customerFullname,
      organizationId: data.orgId,
      branchId: data.branchId,
      role: "CUSTOMER",
      status: "PENDING",
      invitedBy: data.invitedById,
    });

    return { success: true, message: "Müşteri başarıyla davet edildi!" };
  }
}

export const customerService = new CustomerService();
