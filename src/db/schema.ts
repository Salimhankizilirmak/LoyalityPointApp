import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

export const customers = sqliteTable("customers", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  clerkId: text("clerk_id").unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email").notNull().unique(),
  currentPoints: integer("current_points").default(0).notNull(), // Puanlar kuruş olarak tutulur (örn: 12.55 Puan = 1255)
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(), // Clerk organization ID (org_xxx)
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  bossEmail: text("boss_email").notNull(),
  city: text("city"),
  logoUrl: text("logo_url"),
  pointRate: integer("point_rate").default(10).notNull(), // Yüzde olarak puan kazanma oranı (örn: 10 = %10)
  validityMonths: integer("validity_months").default(12).notNull(), // Puanların geçerlilik süresi (ay)
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(), // Organizasyonun aktiflik durumu
  isShowcase: integer("is_showcase", { mode: "boolean" }).default(false).notNull(), // Clerk tarafından zorunlu tutulan vitrin şubesi
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const branches = sqliteTable("branches", {
  id: text("id").$defaultFn(() => createId()).primaryKey(), // Turso local UUID/CUID
  orgId: text("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  city: text("city").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  nameCityIdx: uniqueIndex("name_city_idx").on(table.orgId, table.name, table.city),
}));

export const pointsTransactions = sqliteTable("points_transactions", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id),
  employeeId: text("employee_id").notNull(), // İşlemi yapan çalışanın Clerk User ID'si
  orgId: text("org_id").notNull().references(() => organizations.id), // Ana şirketin Clerk Organization ID'si
  branchId: text("branch_id").notNull().references(() => branches.id), // İşlemin yapıldığı fiziksel şube ID'si
  amount: integer("amount").notNull(), // Puan kuruş olarak (örn: +1255 veya -500)
  transactionType: text("transaction_type", { enum: ["earn", "spend", "manual_adjustment"] }).notNull(),
  isDemo: integer("is_demo", { mode: "boolean" }).default(false).notNull(), // Vitrin şubesinde yapılan demo işlemler
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const staff = sqliteTable("staff", {
  id: text("id").primaryKey(), // Clerk User ID
  orgId: text("org_id").notNull().references(() => organizations.id),
  branchId: text("branch_id").notNull().references(() => branches.id), // Hangi şubeye ait olduğu
  role: text("role", { enum: ["manager", "cashier"] }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});
