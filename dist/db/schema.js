"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.terminalChallengesRelations = exports.terminalsRelations = exports.invitationsRelations = exports.loyaltyTransactionsRelations = exports.loyaltyRulesRelations = exports.customersRelations = exports.organizationsRelations = exports.userBranchesRelations = exports.branchesRelations = exports.usersRelations = exports.invitations = exports.terminalChallenges = exports.terminals = exports.loyaltyTransactions = exports.loyaltyRules = exports.customers = exports.userBranches = exports.pointsTransactions = exports.customerProfiles = exports.staffProfiles = exports.branches = exports.organizations = exports.users = void 0;
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
});
exports.pointsTransactions = (0, sqlite_core_1.sqliteTable)("points_transactions", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    customerProfileId: (0, sqlite_core_1.text)("customer_profile_id").notNull().references(() => exports.customerProfiles.id, { onDelete: "restrict" }),
    branchId: (0, sqlite_core_1.text)("branch_id").notNull().references(() => exports.branches.id, { onDelete: "restrict" }),
    amount: (0, sqlite_core_1.integer)("amount").notNull(),
    type: (0, sqlite_core_1.text)("type", { enum: ["EARN", "SPEND"] }).notNull(),
    description: (0, sqlite_core_1.text)("description"),
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
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
}, (t) => ({
    // Composite UNIQUE: Aynı organizasyonda aynı telefon numarası ikinci kez kaydedilemez
    orgPhoneIdx: (0, sqlite_core_1.uniqueIndex)("org_phone_idx").on(t.organizationId, t.phoneNumber),
}));
exports.loyaltyRules = (0, sqlite_core_1.sqliteTable)("loyalty_rules", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    // Her organizasyonun tek aktif kural seti olabilir (UNIQUE kısıtı)
    organizationId: (0, sqlite_core_1.text)("organization_id").notNull().unique().references(() => exports.organizations.id, { onDelete: "cascade" }),
    earnRatio: (0, sqlite_core_1.integer)("earn_ratio").notNull().default(10),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
});
exports.loyaltyTransactions = (0, sqlite_core_1.sqliteTable)("loyalty_transactions", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(() => (0, cuid2_1.createId)()).primaryKey(),
    organizationId: (0, sqlite_core_1.text)("organization_id").notNull().references(() => exports.organizations.id, { onDelete: "restrict" }),
    branchId: (0, sqlite_core_1.text)("branch_id").notNull().references(() => exports.branches.id, { onDelete: "restrict" }),
    customerId: (0, sqlite_core_1.text)("customer_id").notNull().references(() => exports.customers.id, { onDelete: "restrict" }),
    cashierId: (0, sqlite_core_1.text)("cashier_id").notNull().references(() => exports.users.id, { onDelete: "restrict" }),
    type: (0, sqlite_core_1.text)("type", { enum: ["EARN", "BURN"] }).notNull(),
    amountSpent: (0, sqlite_core_1.integer)("amount_spent").default(0),
    pointsAmount: (0, sqlite_core_1.integer)("points_amount").notNull(),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
});
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
    organizationId: (0, sqlite_core_1.text)("organization_id").notNull().references(() => exports.organizations.id, { onDelete: "cascade" }),
    branchId: (0, sqlite_core_1.text)("branch_id").references(() => exports.branches.id, { onDelete: "cascade" }),
    role: (0, sqlite_core_1.text)("role", { enum: ["BOSS", "MANAGER", "CASHIER", "CUSTOMER"] }).notNull().default("BOSS"),
    status: (0, sqlite_core_1.text)("status", { enum: ["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"] }).notNull().default("PENDING"),
    invitedBy: (0, sqlite_core_1.text)("invited_by").notNull().references(() => exports.users.id, { onDelete: "cascade" }),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().default((0, drizzle_orm_1.sql) `(strftime('%s', 'now'))`),
    expiresAt: (0, sqlite_core_1.integer)("expires_at", { mode: "timestamp" }).notNull().default((0, drizzle_orm_1.sql) `(strftime('%s', 'now') + 604800)`),
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
