import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

export const users = sqliteTable("users", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  clerkId: text("clerk_id").unique().notNull(),
  email: text("email").unique().notNull(),
  role: text("role", { enum: ["ADMIN", "BOSS", "MANAGER", "CASHIER", "CUSTOMER"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const organizations = sqliteTable("organizations", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  name: text("name").notNull(),
  bossId: text("boss_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
