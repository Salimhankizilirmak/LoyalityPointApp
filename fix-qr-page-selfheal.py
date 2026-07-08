import re

file_path = "src/app/(cashier)/cashier-dashboard/qr-invite/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# kodu değiştir
old_code = """  const org = await db.select().from(organizations).where(eq(organizations.id, branch.orgId)).get();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <QrInviteClient 
      branchName={branch.name} 
      registrationCode={org?.registrationCode || null} 
      appUrl={appUrl} 
    />
  );"""

new_code = """  const org = await db.select().from(organizations).where(eq(organizations.id, branch.orgId)).get();
  
  let registrationCode = org?.registrationCode || null;

  // Self-Healing: Eğer organizasyonun registrationCode'u yoksa, rastgele bir kod oluşturup kaydet.
  if (org && !registrationCode) {
    const generateCode = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
      return code;
    };
    
    registrationCode = generateCode();
    try {
      await db.update(organizations)
        .set({ registrationCode })
        .where(eq(organizations.id, org.id));
      console.log(`[Self-Healing] Created registrationCode ${registrationCode} for Org: ${org.id}`);
    } catch (e) {
      console.error("[Self-Healing] Failed to create registrationCode:", e);
      registrationCode = null;
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <QrInviteClient 
      branchName={branch.name} 
      registrationCode={registrationCode} 
      appUrl={appUrl} 
    />
  );"""

content = content.replace(old_code, new_code)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated page.tsx with self healing")
