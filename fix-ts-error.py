import re

file_path = "src/lib/services/customer-service.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# customer tablosuna yazarken name null olmamalı
old_str = "await this.db.update(customers).set({ name: computedName }).where(eq(customers.phoneNumber, userRec.username || \"\"));"
new_str = "await this.db.update(customers).set({ name: computedName || \"İsimsiz Müşteri\" }).where(eq(customers.phoneNumber, userRec.username || \"\"));"
content = content.replace(old_str, new_str)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

file_path2 = "src/app/api/webhooks/clerk/route.ts"
with open(file_path2, "r", encoding="utf-8") as f2:
    content2 = f2.read()

# webhook tarafındaki name'ler? Zaten 'İsimsiz Müşteri' logic'i var ama yinede düzeltelim
old_str2 = """             await db.insert(users).values({
               clerkId: clerkId,
               email: email.toLowerCase(),
               role: "CUSTOMER", // Varsayılan müşteri, login olunca auth-utils günceller
               name: name,
             });"""
new_str2 = """             await db.insert(users).values({
               clerkId: clerkId,
               email: email.toLowerCase(),
               role: "CUSTOMER", // Varsayılan müşteri, login olunca auth-utils günceller
               name: name || "İsimsiz Müşteri",
             });"""
content2 = content2.replace(old_str2, new_str2)

with open(file_path2, "w", encoding="utf-8") as f2:
    f2.write(content2)

