import re

file_path = "src/app/api/webhooks/clerk/route.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# user.updated icindeki 'const name'i 'let name' yap
old_str_1 = 'const name = `${firstName} ${lastName}`.trim() || metadataName || null;'
new_str_1 = 'let name = `${firstName} ${lastName}`.trim() || metadataName || null;'

# user.updated icinde 'name'i davet isminden kopyalama mantigi ekle
# 175. satirda:
# const existingUser = await db.select().from(users).where(eq(users.clerkId, clerkId)).get();
# Oncesine ekliyoruz.
old_str_2 = """    // Sadece kullanıcı yerel veritabanında zaten varsa güncelle (yoksa insert etmek tutarsızlığa yol açabilir)
    const existingUser = await db.select().from(users).where(eq(users.clerkId, clerkId)).get();"""

new_str_2 = """    // Sadece kullanıcı yerel veritabanında zaten varsa güncelle (yoksa insert etmek tutarsızlığa yol açabilir)
    
    // [Kritik Değişiklik] Davet veritabanından isim güncelleme kontrolü
    if (email) {
      try {
        const inviteRecord = await db.select().from(invitations).where(eq(invitations.email, email.trim().toLowerCase())).get();
        if (inviteRecord && inviteRecord.customerName) {
           name = inviteRecord.customerName;
           console.log(`[ClerkWebhook] Override name from invitations in user.updated: ${name}`);
        }
      } catch (err) {
        console.error("Error fetching inviteRecord for name override:", err);
      }
    }

    const existingUser = await db.select().from(users).where(eq(users.clerkId, clerkId)).get();"""

content = content.replace(old_str_1, new_str_1)
content = content.replace(old_str_2, new_str_2)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated webhook user.updated logic")
