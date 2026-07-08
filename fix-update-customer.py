import re

file_path = "src/lib/services/customer-service.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# customerProfiles.$inferInsert tipinde firstName, lastName olmadığı için any/Record yapısı kullanmamız gerekecek
old_update = """  async updateCustomer(id: string, data: Partial<typeof customerProfiles.$inferInsert>) {
    await this.requireOrg();
    
    const profile = await this.db.select().from(customerProfiles).where(eq(customerProfiles.id, id)).get()
      || await this.db.select().from(customerProfiles).where(eq(customerProfiles.userId, id)).get();
      
    if (profile) {
      await this.db.update(customerProfiles).set(data).where(eq(customerProfiles.id, profile.id));
    }
    return { success: true };
  }"""

new_update = """  async updateCustomer(id: string, data: Partial<typeof customerProfiles.$inferInsert> & { firstName?: string, lastName?: string }) {
    await this.requireOrg();
    
    const profile = await this.db.select().from(customerProfiles).where(eq(customerProfiles.id, id)).get()
      || await this.db.select().from(customerProfiles).where(eq(customerProfiles.userId, id)).get();
      
    if (profile) {
      const { firstName, lastName, ...profileData } = data;
      
      // Update Name in Clerk & Users if provided
      if (firstName !== undefined || lastName !== undefined) {
         const userRec = await this.db.select().from(users).where(eq(users.id, profile.userId)).get();
         if (userRec) {
            const client = await this.getClerkClient();
            const currentClerkUser = await client.users.getUser(userRec.clerkId);
            const newFirst = firstName !== undefined ? firstName : currentClerkUser.firstName || "";
            const newLast = lastName !== undefined ? lastName : currentClerkUser.lastName || "";
            const computedName = `${newFirst} ${newLast}`.trim() || null;
            
            await client.users.updateUser(userRec.clerkId, {
               firstName: newFirst,
               lastName: newLast
            });
            
            await this.db.update(users).set({ name: computedName }).where(eq(users.id, profile.userId));
            
            // customers tablosundaki name'i de guncelle
            await this.db.update(customers).set({ name: computedName }).where(eq(customers.phoneNumber, userRec.username || ""));
         }
      }
      
      if (Object.keys(profileData).length > 0) {
        await this.db.update(customerProfiles).set(profileData as Partial<typeof customerProfiles.$inferInsert>).where(eq(customerProfiles.id, profile.id));
      }
    }
    return { success: true };
  }"""

content = content.replace(old_update, new_update)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
