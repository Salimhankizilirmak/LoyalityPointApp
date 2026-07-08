import re

file_path = "src/lib/services/staff-service.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_fn = """  async updateMemberName(memberId: string, firstName: string, lastName: string) {
    const dbUser = await this.db.select().from(users).where(eq(users.id, memberId)).get();
    if (!dbUser) throw new Error("Kullanıcı bulunamadı.");
    if (dbUser.role === "SUPER_ADMIN") throw new Error("Süper Admin bilgileri güncellenemez.");

    const client = await this.getClerkClient();
    await client.users.updateUser(dbUser.clerkId, { firstName, lastName });
    return { success: true };
  }"""

new_fn = """  async updateMemberName(memberId: string, firstName: string, lastName: string) {
    const dbUser = await this.db.select().from(users).where(eq(users.id, memberId)).get();
    if (!dbUser) throw new Error("Kullanıcı bulunamadı.");
    if (dbUser.role === "SUPER_ADMIN") throw new Error("Süper Admin bilgileri güncellenemez.");

    const client = await this.getClerkClient();
    await client.users.updateUser(dbUser.clerkId, { firstName, lastName });
    
    // update local db as well for reports and logs consistency
    const computedName = `${firstName} ${lastName}`.trim() || null;
    await this.db.update(users).set({ name: computedName }).where(eq(users.id, memberId));
    
    return { success: true };
  }"""

content = content.replace(old_fn, new_fn)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
