import re

file_path = "src/lib/auth-utils.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# firstName ve lastName al, name oluştur
old_log = """  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  
  console.log(`[AuthUtils] Determining route for userId: ${userId}, orgId: ${orgId}, orgRole: ${orgRole}`);"""

new_log = """  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const firstName = user.firstName || "";
  const lastName = user.lastName || "";
  const metaName = (user.publicMetadata?.name as string) || "";
  const computedName = `${firstName} ${lastName}`.trim() || metaName || null;
  
  console.log(`[AuthUtils] Determining route for userId: ${userId}, orgId: ${orgId}, orgRole: ${orgRole}`);"""

content = content.replace(old_log, new_log)

# Eşzamanlı senkronizasyon
old_sync = """  // 🔄 Eşzamanlı Yerel Veritabanı Senkronizasyonu (Kvkk ve SaaS geçişi için)
  await db.insert(users).values({
    clerkId: userId,
    email,
    role: dbRole,
  })
  .onConflictDoUpdate({
    target: users.clerkId,
    set: {
      email,
      role: dbRole,
    }
  });"""

new_sync = """  // 🔄 Eşzamanlı Yerel Veritabanı Senkronizasyonu (Kvkk ve SaaS geçişi için)
  // Clerk üzerinde bir isim varsa ve db'de yoksa veya clerkten isim gelmişse name alanını da doldur.
  const existingUser = await db.select().from(users).where(eq(users.clerkId, userId)).get();
  const finalName = computedName || existingUser?.name || null;

  await db.insert(users).values({
    clerkId: userId,
    email,
    role: dbRole,
    name: finalName,
  })
  .onConflictDoUpdate({
    target: users.clerkId,
    set: {
      email,
      role: dbRole,
      ...(computedName ? { name: computedName } : {})
    }
  });"""

content = content.replace(old_sync, new_sync)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
