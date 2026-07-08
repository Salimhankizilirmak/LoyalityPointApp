import re

file_path = "src/app/(cashier)/cashier-dashboard/actions.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add import if missing
if 'import { identityService }' not in content:
    content = content.replace('import { db } from "@/db";', 'import { db } from "@/db";\nimport { identityService } from "@/lib/services/identity-service";')

# Define the new action
new_action = """export async function updateCustomerNameAction(phoneNumber: string, newName: string) {
  try {
    const { orgId } = await resolveCashierContext();
    if (!phoneNumber || !newName || newName.trim().length === 0) {
      return { success: false, error: "Geçersiz veriler." };
    }

    const result = await identityService.syncUserName({
      phoneNumber,
      orgId,
      newName
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (err) {
    console.error("Müşteri ismi güncellenirken hata:", err);
    return { success: false, error: "İsim güncellenemedi." };
  }
}"""

# Pattern to replace the old action
# Note: We will use regex to find the old export async function updateCustomerNameAction block.

pattern = re.compile(r'export async function updateCustomerNameAction\(phoneNumber: string, newName: string\) \{.*?\n\}', re.DOTALL)
if pattern.search(content):
    content = pattern.sub(new_action, content)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Action updated successfully")
else:
    print("Pattern not found")

