import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

export const users = sqliteTable("users", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  clerkId: text("clerk_id").unique().notNull(),
  email: text("email").unique().notNull(),
  role: text("role", { enum: ["SUPER_ADMIN", "BOSS", "MANAGER", "CASHIER", "CUSTOMER"] }).notNull(),
  name: text("name"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const organizations = sqliteTable("organizations", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  name: text("name").notNull(),
  bossId: text("boss_id").references(() => users.id, { onDelete: "cascade" }),
  bossEmail: text("boss_email"),
  branchLimit: integer("branch_limit").default(1).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const branches = sqliteTable("branches", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  city: text("city").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const staffProfiles = sqliteTable("staff_profiles", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  userId: text("user_id").unique().notNull().references(() => users.id, { onDelete: "cascade" }),
  branchId: text("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const customerProfiles = sqliteTable("customer_profiles", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  userId: text("user_id").unique().notNull().references(() => users.id, { onDelete: "cascade" }),
  orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  currentPoints: integer("current_points").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const pointsTransactions = sqliteTable("points_transactions", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  customerProfileId: text("customer_profile_id").notNull().references(() => customerProfiles.id, { onDelete: "restrict" }),
  branchId: text("branch_id").notNull().references(() => branches.id, { onDelete: "restrict" }),
  amount: integer("amount").notNull(),
  type: text("type", { enum: ["EARN", "SPEND"] }).notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const userBranches = sqliteTable("user_branches", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  branchId: text("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  assignedAt: integer("assigned_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// ─── SADAKAT MOTORU TABLOLARI ────────────────────────────────────────────────

export const customers = sqliteTable("customers", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  phoneNumber: text("phone_number").notNull(),
  name: text("name").notNull(),
  totalPoints: integer("total_points").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (t) => ({
  // Composite UNIQUE: Aynı organizasyonda aynı telefon numarası ikinci kez kaydedilemez
  orgPhoneIdx: uniqueIndex("org_phone_idx").on(t.organizationId, t.phoneNumber),
}));

export const loyaltyRules = sqliteTable("loyalty_rules", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  // Her organizasyonun tek aktif kural seti olabilir (UNIQUE kısıtı)
  organizationId: text("organization_id").notNull().unique().references(() => organizations.id, { onDelete: "cascade" }),
  earnRatio: integer("earn_ratio").notNull().default(10),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const loyaltyTransactions = sqliteTable("loyalty_transactions", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "restrict" }),
  branchId: text("branch_id").notNull().references(() => branches.id, { onDelete: "restrict" }),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
  cashierId: text("cashier_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  type: text("type", { enum: ["EARN", "BURN"] }).notNull(),
  amountSpent: integer("amount_spent").default(0),
  pointsAmount: integer("points_amount").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// ─── İLİŞKİLER ───────────────────────────────────────────────────────────────

import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ many }) => ({
  userBranches: many(userBranches),
  cashierTransactions: many(loyaltyTransactions, { relationName: "cashierTransactions" }),
}));

export const branchesRelations = relations(branches, ({ many }) => ({
  userBranches: many(userBranches),
  loyaltyTransactions: many(loyaltyTransactions),
}));

export const userBranchesRelations = relations(userBranches, ({ one }) => ({
  user: one(users, {
    fields: [userBranches.userId],
    references: [users.id],
  }),
  branch: one(branches, {
    fields: [userBranches.branchId],
    references: [branches.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  branches: many(branches),
  customers: many(customers),
  loyaltyRule: one(loyaltyRules, {
    fields: [organizations.id],
    references: [loyaltyRules.organizationId],
  }),
  loyaltyTransactions: many(loyaltyTransactions),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.organizationId],
    references: [organizations.id],
  }),
  loyaltyTransactions: many(loyaltyTransactions),
}));

export const loyaltyRulesRelations = relations(loyaltyRules, ({ one }) => ({
  organization: one(organizations, {
    fields: [loyaltyRules.organizationId],
    references: [organizations.id],
  }),
}));

export const loyaltyTransactionsRelations = relations(loyaltyTransactions, ({ one }) => ({
  organization: one(organizations, {
    fields: [loyaltyTransactions.organizationId],
    references: [organizations.id],
  }),
  branch: one(branches, {
    fields: [loyaltyTransactions.branchId],
    references: [branches.id],
  }),
  customer: one(customers, {
    fields: [loyaltyTransactions.customerId],
    references: [customers.id],
  }),
  cashier: one(users, {
    relationName: "cashierTransactions",
    fields: [loyaltyTransactions.cashierId],
    references: [users.id],
  }),
}));

