import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
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

export const pointsTransactions = sqliteTable("points_transactions", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id),
  employeeId: text("employee_id").notNull(), // İşlemi yapan çalışanın Clerk User ID'si
  orgId: text("org_id").notNull(), // İşlemin yapıldığı şubenin Clerk Organization ID'si
  amount: integer("amount").notNull(), // Puan kuruş olarak (örn: +1255 veya -500)
  transactionType: text("transaction_type", { enum: ["earn", "spend", "manual_adjustment"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(), // Clerk organization ID (org_xxx)
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  bossEmail: text("boss_email").notNull(),
  logoUrl: text("logo_url"),
  pointRate: integer("point_rate").default(10).notNull(), // Yüzde olarak puan kazanma oranı (örn: 10 = %10)
  validityMonths: integer("validity_months").default(12).notNull(), // Puanların geçerlilik süresi (ay)
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});
