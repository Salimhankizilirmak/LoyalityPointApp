import re

# 1. actions.ts dosyasını güncelle
actions_path = "src/app/(cashier)/cashier-dashboard/actions.ts"
with open(actions_path, "r", encoding="utf-8") as f:
    actions_content = f.read()

# a) registerCustomerAction içinde isim zorunluluğu
old_reg = """export async function registerCustomerAction(name: string | null | undefined, phoneNumber: string, email: string) {
  try {
    if (!phoneNumber?.trim() || !email?.trim()) {"""

new_reg = """export async function registerCustomerAction(name: string | null | undefined, phoneNumber: string, email: string) {
  try {
    if (!name?.trim()) {
      return { success: false, error: "Müşteri adı zorunludur." };
    }
    if (!phoneNumber?.trim() || !email?.trim()) {"""

actions_content = actions_content.replace(old_reg, new_reg)

old_safe = """    const safeName = name?.trim() || "İsimsiz Müşteri";
    const parts = safeName.split(/\s+/);"""

new_safe = """    const safeName = name.trim();
    const parts = safeName.split(/\s+/);"""

actions_content = actions_content.replace(old_safe, new_safe)

# b) getBranchCustomerInvitationsAction içinde COALESCE
old_get_inv = """        createdAt: invitations.createdAt,
        customerName: customers.name,
        totalPoints: customers.totalPoints,"""

new_get_inv = """        createdAt: invitations.createdAt,
        customerName: sql<string>`COALESCE(${customers.name}, ${invitations.customerName})`,
        totalPoints: customers.totalPoints,"""

actions_content = actions_content.replace(old_get_inv, new_get_inv)

# c) updateCustomerNameAction içinde invitations tablosunu da güncelle
old_update = """    await db
      .update(customers)
      .set({ name: newName.trim() })
      .where(and(
        eq(customers.organizationId, orgId),
        eq(customers.phoneNumber, normalizedPhone)
      ));

    return { success: true };"""

new_update = """    // 1. Update customers table if exists
    await db
      .update(customers)
      .set({ name: newName.trim() })
      .where(and(
        eq(customers.organizationId, orgId),
        eq(customers.phoneNumber, normalizedPhone)
      ));

    // 2. Update invitations table (for pending users)
    const cleanedPhone = phoneNumber.replace(/\D/g, "");
    await db
      .update(invitations)
      .set({ customerName: newName.trim() })
      .where(and(
        eq(invitations.organizationId, orgId),
        eq(invitations.phoneNumber, cleanedPhone)
      ));

    return { success: true };"""

actions_content = actions_content.replace(old_update, new_update)

with open(actions_path, "w", encoding="utf-8") as f:
    f.write(actions_content)


# 2. customer-service.ts dosyasını güncelle
cs_path = "src/lib/services/customer-service.ts"
with open(cs_path, "r", encoding="utf-8") as f:
    cs_content = f.read()

old_insert = """    await this.db.insert(invitations).values({
      clerkInviteId: invitation.id,
      email: data.email.trim().toLowerCase(),
      phoneNumber: cleanedPhone,
      organizationId: data.orgId,"""

new_insert = """    await this.db.insert(invitations).values({
      clerkInviteId: invitation.id,
      email: data.email.trim().toLowerCase(),
      phoneNumber: cleanedPhone,
      customerName: customerFullname,
      organizationId: data.orgId,"""

cs_content = cs_content.replace(old_insert, new_insert)

with open(cs_path, "w", encoding="utf-8") as f:
    f.write(cs_content)

print("Files updated successfully")

