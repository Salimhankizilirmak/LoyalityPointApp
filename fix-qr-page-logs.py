import re

file_path = "src/app/(cashier)/cashier-dashboard/qr-invite/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Kodu konsol loglariyla degistir
old_code = """  const ctx = await resolveActiveBranchContext();
  if (!ctx?.activeBranchId) {
    redirect("/cashier-dashboard");
  }

  const branch = await db.select().from(branches).where(eq(branches.id, ctx.activeBranchId)).get();
  
  if (!branch) {
    redirect("/cashier-dashboard");
  }

  const org = await db.select().from(organizations).where(eq(organizations.id, branch.orgId)).get();"""

new_code = """  const ctx = await resolveActiveBranchContext();
  console.log("[QR-Invite] Context:", ctx);
  if (!ctx?.activeBranchId) {
    console.log("[QR-Invite] No activeBranchId, but ignoring redirect to debug!");
  }

  const branch = ctx?.activeBranchId ? await db.select().from(branches).where(eq(branches.id, ctx.activeBranchId)).get() : null;
  console.log("[QR-Invite] Branch:", branch);
  
  if (!branch) {
    console.log("[QR-Invite] No branch found, ignoring redirect to debug!");
  }

  const org = branch ? await db.select().from(organizations).where(eq(organizations.id, branch.orgId)).get() : null;
  console.log("[QR-Invite] Org:", org);"""

content = content.replace(old_code, new_code)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated page.tsx with logs")
