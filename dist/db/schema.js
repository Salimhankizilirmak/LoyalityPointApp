"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityLogs = exports.registrationAttempts = exports.customerRegistrationRequests = exports.branchesCampaignsRelations = exports.campaignsRelations = exports.terminalChallengesRelations = exports.terminalsRelations = exports.invitationsRelations = exports.loyaltyTransactionsRelations = exports.loyaltyRulesRelations = exports.customersRelations = exports.organizationsRelations = exports.userBranchesRelations = exports.branchesRelations = exports.usersRelations = exports.qrCustomerRequests = exports.invitations = exports.terminalChallenges = exports.terminals = exports.campaignSends = exports.campaigns = exports.loyaltyTransactions = exports.loyaltyRules = exports.customers = exports.userBranches = exports.pointsTransactions = exports.customerProfiles = exports.staffProfiles = exports.branches = exports.organizations = exports.users = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const cuid2_1 = require("@paralleldrive/cuid2");
const crypto_1 = require("crypto");
exports.users = (0, sqlite_core_1.sqliteTable)("users", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    clerkId: (0, sqlite_core_1.text)("clerk_id").unique().notNull(),
    email: (0, sqlite_core_1.text)("email").unique().notNull(),
    username: (0, sqlite_core_1.text)("username").unique(),
    role: (0, sqlite_core_1.text)("role", { enum: ["SUPER_ADMIN", "BOSS", "MANAGER", "CASHIER", "CUSTOMER"] }).notNull(),
    name: (0, sqlite_core_1.text)("name"),
    imageUrl: (0, sqlite_core_1.text)("image_url"),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
});
exports.organizations = (0, sqlite_core_1.sqliteTable)("organizations", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    name: (0, sqlite_core_1.text)("name").notNull(),
    registrationCode: (0, sqlite_core_1.text)("registration_code").unique(),
    bossId: (0, sqlite_core_1.text)("boss_id").references(() => exports.users.id, { onDelete: "cascade" }),
    bossEmail: (0, sqlite_core_1.text)("boss_email"),
    branchLimit: (0, sqlite_core_1.integer)("branch_limit").default(1).notNull(),
    isActive: (0, sqlite_core_1.integer)("is_active", { mode: "boolean" }).default(true).notNull(),
    status: (0, sqlite_core_1.text)("status", { enum: ["PENDING", "ACTIVE", "DISABLED"] }).default("PENDING").notNull(),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
});
exports.branches = (0, sqlite_core_1.sqliteTable)("branches", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    orgId: (0, sqlite_core_1.text)("org_id").notNull().references(() => exports.organizations.id, { onDelete: "cascade" }),
    name: (0, sqlite_core_1.text)("name").notNull(),
    city: (0, sqlite_core_1.text)("city").notNull(),
    isActive: (0, sqlite_core_1.integer)("is_active", { mode: "boolean" }).default(true).notNull(),
    managerId: (0, sqlite_core_1.text)("manager_id").references(() => exports.users.id, { onDelete: "set null" }),
    defaultEarnRatio: (0, sqlite_core_1.integer)("default_earn_ratio").default(10).notNull(),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
});
exports.staffProfiles = (0, sqlite_core_1.sqliteTable)("staff_profiles", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    userId: (0, sqlite_core_1.text)("user_id").unique().notNull().references(() => exports.users.id, { onDelete: "cascade" }),
    branchId: (0, sqlite_core_1.text)("branch_id").notNull().references(() => exports.branches.id, { onDelete: "cascade" }),
    isActive: (0, sqlite_core_1.integer)("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
});
exports.customerProfiles = (0, sqlite_core_1.sqliteTable)("customer_profiles", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    userId: (0, sqlite_core_1.text)("user_id").unique().notNull().references(() => exports.users.id, { onDelete: "cascade" }),
    orgId: (0, sqlite_core_1.text)("org_id").notNull().references(() => exports.organizations.id, { onDelete: "cascade" }),
    currentPoints: (0, sqlite_core_1.integer)("current_points").default(0).notNull(),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
    kvkkStatus: (0, sqlite_core_1.integer)("kvkk_status", { mode: "boolean" }).notNull().default(false),
    kvkkAcceptedAt: (0, sqlite_core_1.integer)("kvkk_accepted_at"),
});
exports.pointsTransactions = (0, sqlite_core_1.sqliteTable)("points_transactions", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    customerProfileId: (0, sqlite_core_1.text)("customer_profile_id").notNull().references(() => exports.customerProfiles.id, { onDelete: "restrict" }),
    branchId: (0, sqlite_core_1.text)("branch_id").notNull().references(() => exports.branches.id, { onDelete: "restrict" }),
    amount: (0, sqlite_core_1.integer)("amount").notNull(),
    type: (0, sqlite_core_1.text)("type", { enum: ["EARN", "SPEND"] }).notNull(),
    description: (0, sqlite_core_1.text)("description"),
    status: (0, sqlite_core_1.text)("status", { enum: ["SUCCESS", "VOIDED"] }).notNull().default("SUCCESS"),
    parentTransactionId: (0, sqlite_core_1.text)("parent_transaction_id"),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
});
exports.userBranches = (0, sqlite_core_1.sqliteTable)("user_branches", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    userId: (0, sqlite_core_1.text)("user_id").notNull().references(() => exports.users.id, { onDelete: "cascade" }),
    branchId: (0, sqlite_core_1.text)("branch_id").notNull().references(() => exports.branches.id, { onDelete: "cascade" }),
    assignedAt: (0, sqlite_core_1.integer)("assigned_at", { mode: "timestamp" }).default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`).notNull(),
});
// ─── SADAKAT MOTORU TABLOLARI ────────────────────────────────────────────────
exports.customers = (0, sqlite_core_1.sqliteTable)("customers", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    organizationId: (0, sqlite_core_1.text)("organization_id").notNull().references(() => exports.organizations.id, { onDelete: "cascade" }),
    phoneNumber: (0, sqlite_core_1.text)("phone_number").notNull(),
    name: (0, sqlite_core_1.text)("name").notNull(),
    totalPoints: (0, sqlite_core_1.integer)("total_points").notNull().default(0),
    registrationSource: (0, sqlite_core_1.text)("registration_source").notNull().default("CASHIER_INVITE"),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
    lastActiveAt: (0, sqlite_core_1.integer)("last_active_at", { mode: "timestamp" }),
}, (t) => ({
    // Composite UNIQUE: Aynı organizasyonda aynı telefon numarası ikinci kez kaydedilemez
    orgPhoneIdx: (0, sqlite_core_1.uniqueIndex)("org_phone_idx").on(t.organizationId, t.phoneNumber),
}));
exports.loyaltyRules = (0, sqlite_core_1.sqliteTable)("loyalty_rules", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    // Her organizasyonun tek aktif kural seti olabilir (UNIQUE kısıtı)
    organizationId: (0, sqlite_core_1.text)("organization_id").notNull().unique().references(() => exports.organizations.id, { onDelete: "cascade" }),
    earnRatio: (0, sqlite_core_1.integer)("earn_ratio").notNull().default(10),
    pointsEquivalent: (0, sqlite_core_1.integer)("points_equivalent").notNull().default(1),
    tlEquivalent: (0, sqlite_core_1.integer)("tl_equivalent").notNull().default(1),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
});
exports.loyaltyTransactions = (0, sqlite_core_1.sqliteTable)("loyalty_transactions", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    organizationId: (0, sqlite_core_1.text)("organization_id").notNull().references(() => exports.organizations.id, { onDelete: "restrict" }),
    branchId: (0, sqlite_core_1.text)("branch_id").notNull().references(() => exports.branches.id, { onDelete: "restrict" }),
    customerId: (0, sqlite_core_1.text)("customer_id").notNull().references(() => exports.customers.id, { onDelete: "restrict" }),
    cashierId: (0, sqlite_core_1.text)("cashier_id").notNull().references(() => exports.users.id, { onDelete: "restrict" }),
    type: (0, sqlite_core_1.text)("type", { enum: ["EARN", "BURN", "VOID", "CASH_SETTLEMENT"] }).notNull(),
    amountSpent: (0, sqlite_core_1.integer)("amount_spent").default(0),
    pointsAmount: (0, sqlite_core_1.integer)("points_amount").notNull(),
    description: (0, sqlite_core_1.text)("description"),
    status: (0, sqlite_core_1.text)("status", { enum: ["SUCCESS", "VOIDED"] }).notNull().default("SUCCESS"),
    parentTransactionId: (0, sqlite_core_1.text)("parent_transaction_id"),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
});
// ─── KAMPANYA TABLOSU ────────────────────────────────────────────────────────
exports.campaigns = (0, sqlite_core_1.sqliteTable)("campaigns", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    branchId: (0, sqlite_core_1.text)("branch_id").notNull().references(() => exports.branches.id, { onDelete: "cascade" }),
    name: (0, sqlite_core_1.text)("name").notNull(),
    earnRatio: (0, sqlite_core_1.integer)("earn_ratio").notNull(),
    campaignType: (0, sqlite_core_1.text)("campaign_type", { enum: ["multiplier", "tiered"] }).default("multiplier").notNull(),
    tiers: (0, sqlite_core_1.text)("tiers", { mode: "json" }),
    startDate: (0, sqlite_core_1.integer)("start_date", { mode: "timestamp" }).notNull(),
    endDate: (0, sqlite_core_1.integer)("end_date", { mode: "timestamp" }).notNull(),
    isActive: (0, sqlite_core_1.integer)("is_active", { mode: "boolean" }).default(true).notNull(),
    description: (0, sqlite_core_1.text)("description"),
    createdBy: (0, sqlite_core_1.text)("created_by").notNull().references(() => exports.users.id, { onDelete: "restrict" }),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`).notNull(),
    updatedAt: (0, sqlite_core_1.integer)("updated_at", { mode: "timestamp" }),
    inactivityThresholdDays: (0, sqlite_core_1.integer)("inactivity_threshold_days").notNull().default(60),
});
exports.campaignSends = (0, sqlite_core_1.sqliteTable)("campaign_sends", {
    id: (0, sqlite_core_1.text)("id").primaryKey(),
    campaignId: (0, sqlite_core_1.text)("campaign_id").notNull().references(() => exports.campaigns.id),
    customerId: (0, sqlite_core_1.text)("customer_id").notNull().references(() => exports.customers.id),
    status: (0, sqlite_core_1.text)("status").notNull(), // "pending" | "sent" | "failed"
    error: (0, sqlite_core_1.text)("error"),
    sentAt: (0, sqlite_core_1.integer)("sent_at", { mode: "timestamp" }),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
    campaignCustomerUniq: (0, sqlite_core_1.uniqueIndex)("campaign_customer_uniq").on(t.campaignId, t.customerId),
}));
// ─── TERMINAL (POS KASA) TABLOLARI ──────────────────────────────────────────
exports.terminals = (0, sqlite_core_1.sqliteTable)("terminals", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    branchId: (0, sqlite_core_1.text)("branch_id").references(() => exports.branches.id, { onDelete: "cascade" }),
    name: (0, sqlite_core_1.text)("name").notNull(),
    hardwareHash: (0, sqlite_core_1.text)("hardware_hash").unique().notNull(),
    secretKey: (0, sqlite_core_1.text)("secret_key").notNull().$defaultFn(() => (0, crypto_1.randomBytes)(32).toString("hex")),
    isActive: (0, sqlite_core_1.integer)("is_active", { mode: "boolean" }).default(false).notNull(),
    lastSeenAt: (0, sqlite_core_1.integer)("last_seen_at"),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`).notNull(),
});
exports.terminalChallenges = (0, sqlite_core_1.sqliteTable)("terminal_challenges", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    terminalId: (0, sqlite_core_1.text)("terminal_id").notNull().references(() => exports.terminals.id, { onDelete: "cascade" }),
    nonce: (0, sqlite_core_1.text)("nonce").unique().notNull(),
    expiresAt: (0, sqlite_core_1.integer)("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`).notNull(),
});
// ─── DAVETİYE SHADOW TABLOSU ─────────────────────────────────────────────────
exports.invitations = (0, sqlite_core_1.sqliteTable)("invitations", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    clerkInviteId: (0, sqlite_core_1.text)("clerk_invite_id").unique(),
    email: (0, sqlite_core_1.text)("email").notNull(),
    phoneNumber: (0, sqlite_core_1.text)("phone_number"),
    customerName: (0, sqlite_core_1.text)("customer_name"),
    organizationId: (0, sqlite_core_1.text)("organization_id").notNull().references(() => exports.organizations.id, { onDelete: "cascade" }),
    branchId: (0, sqlite_core_1.text)("branch_id").references(() => exports.branches.id, { onDelete: "cascade" }),
    role: (0, sqlite_core_1.text)("role", { enum: ["BOSS", "MANAGER", "CASHIER", "CUSTOMER"] }).notNull().default("BOSS"),
    status: (0, sqlite_core_1.text)("status", { enum: ["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"] }).notNull().default("PENDING"),
    invitedBy: (0, sqlite_core_1.text)("invited_by").notNull().references(() => exports.users.id, { onDelete: "cascade" }),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
    expiresAt: (0, sqlite_core_1.integer)("expires_at", { mode: "timestamp" }).notNull().default((0, drizzle_orm_1.sql) `(strftime('%s', 'now') + 604800)`),
});
exports.qrCustomerRequests = (0, sqlite_core_1.sqliteTable)("qr_customer_requests", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    organizationId: (0, sqlite_core_1.text)("organization_id").notNull().references(() => exports.organizations.id, { onDelete: "cascade" }),
    branchId: (0, sqlite_core_1.text)("branch_id").notNull().references(() => exports.branches.id, { onDelete: "cascade" }),
    firstName: (0, sqlite_core_1.text)("first_name").notNull(),
    lastName: (0, sqlite_core_1.text)("last_name").notNull(),
    email: (0, sqlite_core_1.text)("email").notNull(),
    phoneNumber: (0, sqlite_core_1.text)("phone_number").notNull(),
    status: (0, sqlite_core_1.text)("status", { enum: ["PENDING", "APPROVED", "REJECTED"] }).notNull().default("PENDING"),
    clerkTicketUrl: (0, sqlite_core_1.text)("clerk_ticket_url"),
    ipAddress: (0, sqlite_core_1.text)("ip_address"),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
});
// ─── İLİŞKİLER ───────────────────────────────────────────────────────────────
const drizzle_orm_2 = require("drizzle-orm");
exports.usersRelations = (0, drizzle_orm_2.relations)(exports.users, ({ many }) => ({
    userBranches: many(exports.userBranches),
    cashierTransactions: many(exports.loyaltyTransactions, { relationName: "cashierTransactions" }),
    managedBranches: many(exports.branches),
    sentInvitations: many(exports.invitations),
}));
exports.branchesRelations = (0, drizzle_orm_2.relations)(exports.branches, ({ many, one }) => ({
    userBranches: many(exports.userBranches),
    loyaltyTransactions: many(exports.loyaltyTransactions),
    manager: one(exports.users, {
        fields: [exports.branches.managerId],
        references: [exports.users.id],
    }),
}));
exports.userBranchesRelations = (0, drizzle_orm_2.relations)(exports.userBranches, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.userBranches.userId],
        references: [exports.users.id],
    }),
    branch: one(exports.branches, {
        fields: [exports.userBranches.branchId],
        references: [exports.branches.id],
    }),
}));
exports.organizationsRelations = (0, drizzle_orm_2.relations)(exports.organizations, ({ many, one }) => ({
    branches: many(exports.branches),
    customers: many(exports.customers),
    loyaltyRule: one(exports.loyaltyRules, {
        fields: [exports.organizations.id],
        references: [exports.loyaltyRules.organizationId],
    }),
    loyaltyTransactions: many(exports.loyaltyTransactions),
    invitations: many(exports.invitations),
}));
exports.customersRelations = (0, drizzle_orm_2.relations)(exports.customers, ({ one, many }) => ({
    organization: one(exports.organizations, {
        fields: [exports.customers.organizationId],
        references: [exports.organizations.id],
    }),
    loyaltyTransactions: many(exports.loyaltyTransactions),
}));
exports.loyaltyRulesRelations = (0, drizzle_orm_2.relations)(exports.loyaltyRules, ({ one }) => ({
    organization: one(exports.organizations, {
        fields: [exports.loyaltyRules.organizationId],
        references: [exports.organizations.id],
    }),
}));
exports.loyaltyTransactionsRelations = (0, drizzle_orm_2.relations)(exports.loyaltyTransactions, ({ one }) => ({
    organization: one(exports.organizations, {
        fields: [exports.loyaltyTransactions.organizationId],
        references: [exports.organizations.id],
    }),
    branch: one(exports.branches, {
        fields: [exports.loyaltyTransactions.branchId],
        references: [exports.branches.id],
    }),
    customer: one(exports.customers, {
        fields: [exports.loyaltyTransactions.customerId],
        references: [exports.customers.id],
    }),
    cashier: one(exports.users, {
        relationName: "cashierTransactions",
        fields: [exports.loyaltyTransactions.cashierId],
        references: [exports.users.id],
    }),
}));
exports.invitationsRelations = (0, drizzle_orm_2.relations)(exports.invitations, ({ one }) => ({
    organization: one(exports.organizations, {
        fields: [exports.invitations.organizationId],
        references: [exports.organizations.id],
    }),
    inviter: one(exports.users, {
        fields: [exports.invitations.invitedBy],
        references: [exports.users.id],
    }),
}));
exports.terminalsRelations = (0, drizzle_orm_2.relations)(exports.terminals, ({ one, many }) => ({
    branch: one(exports.branches, {
        fields: [exports.terminals.branchId],
        references: [exports.branches.id],
    }),
    challenges: many(exports.terminalChallenges),
}));
exports.terminalChallengesRelations = (0, drizzle_orm_2.relations)(exports.terminalChallenges, ({ one }) => ({
    terminal: one(exports.terminals, {
        fields: [exports.terminalChallenges.terminalId],
        references: [exports.terminals.id],
    }),
}));
exports.campaignsRelations = (0, drizzle_orm_2.relations)(exports.campaigns, ({ one }) => ({
    branch: one(exports.branches, {
        fields: [exports.campaigns.branchId],
        references: [exports.branches.id],
    }),
    creator: one(exports.users, {
        fields: [exports.campaigns.createdBy],
        references: [exports.users.id],
    }),
}));
exports.branchesCampaignsRelations = (0, drizzle_orm_2.relations)(exports.branches, ({ many, one }) => ({
    campaigns: many(exports.campaigns),
}));
// ─── QR REGISTRATION & LIVE ACTIVITY TABLES ──────────────────────────────────
exports.customerRegistrationRequests = (0, sqlite_core_1.sqliteTable)("customer_registration_requests", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    orgId: (0, sqlite_core_1.text)("org_id").notNull(),
    name: (0, sqlite_core_1.text)("name").notNull(),
    email: (0, sqlite_core_1.text)("email").notNull(),
    phone: (0, sqlite_core_1.text)("phone").notNull(),
    clerkUserId: (0, sqlite_core_1.text)("clerk_user_id"),
    status: (0, sqlite_core_1.text)("status").notNull().default("PENDING_APPROVAL"), // PENDING_APPROVAL | APPROVED | REJECTED
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
    approvedByCashierId: (0, sqlite_core_1.text)("approved_by_cashier_id"),
    decidedAt: (0, sqlite_core_1.integer)("decided_at", { mode: "timestamp" }),
});
exports.registrationAttempts = (0, sqlite_core_1.sqliteTable)("registration_attempts", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    ip: (0, sqlite_core_1.text)("ip").notNull(),
    orgId: (0, sqlite_core_1.text)("org_id").notNull(),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
});
exports.activityLogs = (0, sqlite_core_1.sqliteTable)("activity_logs", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    orgId: (0, sqlite_core_1.text)("org_id").notNull(),
    type: (0, sqlite_core_1.text)("type").notNull(),
    actorName: (0, sqlite_core_1.text)("actor_name"),
    actorRole: (0, sqlite_core_1.text)("actor_role"),
    targetName: (0, sqlite_core_1.text)("target_name"),
    description: (0, sqlite_core_1.text)("description").notNull(),
    metadata: (0, sqlite_core_1.text)("metadata"),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
}, (t) => ({
    orgTimeIdx: (0, sqlite_core_1.index)("activity_logs_org_time_idx").on(t.orgId, t.createdAt),
}));
