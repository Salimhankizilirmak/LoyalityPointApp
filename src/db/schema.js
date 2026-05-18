"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pendingInvitations = exports.loyaltyTransactionsRelations = exports.loyaltyRulesRelations = exports.customersRelations = exports.organizationsRelations = exports.userBranchesRelations = exports.branchesRelations = exports.usersRelations = exports.loyaltyTransactions = exports.loyaltyRules = exports.customers = exports.userBranches = exports.pointsTransactions = exports.customerProfiles = exports.staffProfiles = exports.branches = exports.organizations = exports.users = void 0;
var drizzle_orm_1 = require("drizzle-orm");
var sqlite_core_1 = require("drizzle-orm/sqlite-core");
var cuid2_1 = require("@paralleldrive/cuid2");
exports.users = (0, sqlite_core_1.sqliteTable)("users", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(function () { return (0, cuid2_1.createId)(); }).primaryKey(),
    clerkId: (0, sqlite_core_1.text)("clerk_id").unique().notNull(),
    email: (0, sqlite_core_1.text)("email").unique().notNull(),
    role: (0, sqlite_core_1.text)("role", { enum: ["SUPER_ADMIN", "BOSS", "MANAGER", "CASHIER", "CUSTOMER"] }).notNull(),
    name: (0, sqlite_core_1.text)("name"),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).default((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["(strftime('%s', 'now'))"], ["(strftime('%s', 'now'))"])))),
});
exports.organizations = (0, sqlite_core_1.sqliteTable)("organizations", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(function () { return (0, cuid2_1.createId)(); }).primaryKey(),
    name: (0, sqlite_core_1.text)("name").notNull(),
    bossId: (0, sqlite_core_1.text)("boss_id").references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    bossEmail: (0, sqlite_core_1.text)("boss_email"),
    branchLimit: (0, sqlite_core_1.integer)("branch_limit").default(1).notNull(),
    isActive: (0, sqlite_core_1.integer)("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).default((0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["(strftime('%s', 'now'))"], ["(strftime('%s', 'now'))"])))),
});
exports.branches = (0, sqlite_core_1.sqliteTable)("branches", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(function () { return (0, cuid2_1.createId)(); }).primaryKey(),
    orgId: (0, sqlite_core_1.text)("org_id").notNull().references(function () { return exports.organizations.id; }, { onDelete: "cascade" }),
    name: (0, sqlite_core_1.text)("name").notNull(),
    city: (0, sqlite_core_1.text)("city").notNull(),
    isActive: (0, sqlite_core_1.integer)("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).default((0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["(strftime('%s', 'now'))"], ["(strftime('%s', 'now'))"])))),
});
exports.staffProfiles = (0, sqlite_core_1.sqliteTable)("staff_profiles", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(function () { return (0, cuid2_1.createId)(); }).primaryKey(),
    userId: (0, sqlite_core_1.text)("user_id").unique().notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    branchId: (0, sqlite_core_1.text)("branch_id").notNull().references(function () { return exports.branches.id; }, { onDelete: "cascade" }),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).default((0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["(strftime('%s', 'now'))"], ["(strftime('%s', 'now'))"])))),
});
exports.customerProfiles = (0, sqlite_core_1.sqliteTable)("customer_profiles", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(function () { return (0, cuid2_1.createId)(); }).primaryKey(),
    userId: (0, sqlite_core_1.text)("user_id").unique().notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    orgId: (0, sqlite_core_1.text)("org_id").notNull().references(function () { return exports.organizations.id; }, { onDelete: "cascade" }),
    currentPoints: (0, sqlite_core_1.integer)("current_points").default(0).notNull(),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).default((0, drizzle_orm_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["(strftime('%s', 'now'))"], ["(strftime('%s', 'now'))"])))),
});
exports.pointsTransactions = (0, sqlite_core_1.sqliteTable)("points_transactions", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(function () { return (0, cuid2_1.createId)(); }).primaryKey(),
    customerProfileId: (0, sqlite_core_1.text)("customer_profile_id").notNull().references(function () { return exports.customerProfiles.id; }, { onDelete: "restrict" }),
    branchId: (0, sqlite_core_1.text)("branch_id").notNull().references(function () { return exports.branches.id; }, { onDelete: "restrict" }),
    amount: (0, sqlite_core_1.integer)("amount").notNull(),
    type: (0, sqlite_core_1.text)("type", { enum: ["EARN", "SPEND"] }).notNull(),
    description: (0, sqlite_core_1.text)("description"),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).default((0, drizzle_orm_1.sql)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["(strftime('%s', 'now'))"], ["(strftime('%s', 'now'))"])))),
});
exports.userBranches = (0, sqlite_core_1.sqliteTable)("user_branches", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(function () { return (0, cuid2_1.createId)(); }).primaryKey(),
    userId: (0, sqlite_core_1.text)("user_id").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    branchId: (0, sqlite_core_1.text)("branch_id").notNull().references(function () { return exports.branches.id; }, { onDelete: "cascade" }),
    assignedAt: (0, sqlite_core_1.integer)("assigned_at", { mode: "timestamp" }).default((0, drizzle_orm_1.sql)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["(strftime('%s', 'now'))"], ["(strftime('%s', 'now'))"])))).notNull(),
});
// ─── SADAKAT MOTORU TABLOLARI ────────────────────────────────────────────────
exports.customers = (0, sqlite_core_1.sqliteTable)("customers", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(function () { return (0, cuid2_1.createId)(); }).primaryKey(),
    organizationId: (0, sqlite_core_1.text)("organization_id").notNull().references(function () { return exports.organizations.id; }, { onDelete: "cascade" }),
    phoneNumber: (0, sqlite_core_1.text)("phone_number").notNull(),
    name: (0, sqlite_core_1.text)("name").notNull(),
    totalPoints: (0, sqlite_core_1.integer)("total_points").notNull().default(0),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().default((0, drizzle_orm_1.sql)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["(strftime('%s', 'now'))"], ["(strftime('%s', 'now'))"])))),
}, function (t) { return ({
    // Composite UNIQUE: Aynı organizasyonda aynı telefon numarası ikinci kez kaydedilemez
    orgPhoneIdx: (0, sqlite_core_1.uniqueIndex)("org_phone_idx").on(t.organizationId, t.phoneNumber),
}); });
exports.loyaltyRules = (0, sqlite_core_1.sqliteTable)("loyalty_rules", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(function () { return (0, cuid2_1.createId)(); }).primaryKey(),
    // Her organizasyonun tek aktif kural seti olabilir (UNIQUE kısıtı)
    organizationId: (0, sqlite_core_1.text)("organization_id").notNull().unique().references(function () { return exports.organizations.id; }, { onDelete: "cascade" }),
    earnRatio: (0, sqlite_core_1.integer)("earn_ratio").notNull().default(10),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().default((0, drizzle_orm_1.sql)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["(strftime('%s', 'now'))"], ["(strftime('%s', 'now'))"])))),
});
exports.loyaltyTransactions = (0, sqlite_core_1.sqliteTable)("loyalty_transactions", {
    id: (0, sqlite_core_1.text)("id").$defaultFn(function () { return (0, cuid2_1.createId)(); }).primaryKey(),
    organizationId: (0, sqlite_core_1.text)("organization_id").notNull().references(function () { return exports.organizations.id; }, { onDelete: "restrict" }),
    branchId: (0, sqlite_core_1.text)("branch_id").notNull().references(function () { return exports.branches.id; }, { onDelete: "restrict" }),
    customerId: (0, sqlite_core_1.text)("customer_id").notNull().references(function () { return exports.customers.id; }, { onDelete: "restrict" }),
    cashierId: (0, sqlite_core_1.text)("cashier_id").notNull().references(function () { return exports.users.id; }, { onDelete: "restrict" }),
    type: (0, sqlite_core_1.text)("type", { enum: ["EARN", "BURN"] }).notNull(),
    amountSpent: (0, sqlite_core_1.integer)("amount_spent").default(0),
    pointsAmount: (0, sqlite_core_1.integer)("points_amount").notNull(),
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().default((0, drizzle_orm_1.sql)(templateObject_10 || (templateObject_10 = __makeTemplateObject(["(strftime('%s', 'now'))"], ["(strftime('%s', 'now'))"])))),
});
// ─── İLİŞKİLER ───────────────────────────────────────────────────────────────
var drizzle_orm_2 = require("drizzle-orm");
exports.usersRelations = (0, drizzle_orm_2.relations)(exports.users, function (_a) {
    var many = _a.many;
    return ({
        userBranches: many(exports.userBranches),
        cashierTransactions: many(exports.loyaltyTransactions, { relationName: "cashierTransactions" }),
    });
});
exports.branchesRelations = (0, drizzle_orm_2.relations)(exports.branches, function (_a) {
    var many = _a.many;
    return ({
        userBranches: many(exports.userBranches),
        loyaltyTransactions: many(exports.loyaltyTransactions),
    });
});
exports.userBranchesRelations = (0, drizzle_orm_2.relations)(exports.userBranches, function (_a) {
    var one = _a.one;
    return ({
        user: one(exports.users, {
            fields: [exports.userBranches.userId],
            references: [exports.users.id],
        }),
        branch: one(exports.branches, {
            fields: [exports.userBranches.branchId],
            references: [exports.branches.id],
        }),
    });
});
exports.organizationsRelations = (0, drizzle_orm_2.relations)(exports.organizations, function (_a) {
    var many = _a.many, one = _a.one;
    return ({
        branches: many(exports.branches),
        customers: many(exports.customers),
        loyaltyRule: one(exports.loyaltyRules, {
            fields: [exports.organizations.id],
            references: [exports.loyaltyRules.organizationId],
        }),
        loyaltyTransactions: many(exports.loyaltyTransactions),
    });
});
exports.customersRelations = (0, drizzle_orm_2.relations)(exports.customers, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        organization: one(exports.organizations, {
            fields: [exports.customers.organizationId],
            references: [exports.organizations.id],
        }),
        loyaltyTransactions: many(exports.loyaltyTransactions),
    });
});
exports.loyaltyRulesRelations = (0, drizzle_orm_2.relations)(exports.loyaltyRules, function (_a) {
    var one = _a.one;
    return ({
        organization: one(exports.organizations, {
            fields: [exports.loyaltyRules.organizationId],
            references: [exports.organizations.id],
        }),
    });
});
exports.loyaltyTransactionsRelations = (0, drizzle_orm_2.relations)(exports.loyaltyTransactions, function (_a) {
    var one = _a.one;
    return ({
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
    });
});
// ─── BEKLEYEN DAVETLER SENKRONİZASYON TABLOSU ──────────────────────────────────
exports.pendingInvitations = (0, sqlite_core_1.sqliteTable)("pending_invitations", {
    id: (0, sqlite_core_1.text)("id").primaryKey(), // Clerk invitation ID'si
    email: (0, sqlite_core_1.text)("email").notNull(), // Normalize küçük harf e-posta adresi
    organizationId: (0, sqlite_core_1.text)("organization_id"), // Organizasyon bazlı davet ise organizasyon ID'si
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).default((0, drizzle_orm_1.sql)(templateObject_11 || (templateObject_11 = __makeTemplateObject(["(strftime('%s', 'now'))"], ["(strftime('%s', 'now'))"])))).notNull(),
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11;
