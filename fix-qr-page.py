import re

file_path = "src/app/(cashier)/cashier-dashboard/qr-invite/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# organizations importunu ekle
if "organizations" not in content:
    content = content.replace('import { branches } from "@/db/schema";', 'import { branches, organizations } from "@/db/schema";')

# kodu değiştir
old_code = """  const branch = await db.select().from(branches).where(eq(branches.id, ctx.activeBranchId)).get();
  
  if (!branch) {
    redirect("/cashier-dashboard");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <QrInviteClient 
      branchName={branch.name} 
      registrationCode={branch.registrationCode} 
      appUrl={appUrl} 
    />
  );"""

new_code = """  const branch = await db.select().from(branches).where(eq(branches.id, ctx.activeBranchId)).get();
  
  if (!branch) {
    redirect("/cashier-dashboard");
  }

  const org = await db.select().from(organizations).where(eq(organizations.id, branch.orgId)).get();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <QrInviteClient 
      branchName={branch.name} 
      registrationCode={org?.registrationCode || null} 
      appUrl={appUrl} 
    />
  );"""

content = content.replace(old_code, new_code)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated page.tsx")
