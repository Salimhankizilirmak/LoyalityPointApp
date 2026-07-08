import re

file_path = "src/db/schema.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# invitations tablosuna customerName ekle
old_schema = """export const invitations = sqliteTable("invitations", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  clerkInviteId: text("clerk_invite_id").unique(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number"),"""

new_schema = """export const invitations = sqliteTable("invitations", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  clerkInviteId: text("clerk_invite_id").unique(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number"),
  customerName: text("customer_name"),"""

if old_schema in content:
    content = content.replace(old_schema, new_schema)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Schema updated successfully")
else:
    print("Pattern not found in schema.ts")

