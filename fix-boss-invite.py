import re

file_path = "src/components/features/boss-dashboard/ui/InviteModal.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_valid = """  const isForbidden = FORBIDDEN_EMAILS.includes(form.email.toLowerCase().trim()) || form.email.toLowerCase().trim() === bossEmail?.toLowerCase() || envEmails.includes(form.email.toLowerCase().trim());
  const valid = form.email && form.phone.length === 10 && emailRegex.test(form.email) && !isForbidden && (fixedRole === "cashier" ? true : !!form.branch);"""

new_valid = """  const isForbidden = FORBIDDEN_EMAILS.includes(form.email.toLowerCase().trim()) || form.email.toLowerCase().trim() === bossEmail?.toLowerCase() || envEmails.includes(form.email.toLowerCase().trim());
  const valid = form.name.trim() !== "" && form.email && form.phone.length === 10 && emailRegex.test(form.email) && !isForbidden && (fixedRole === "cashier" ? true : !!form.branch);"""

content = content.replace(old_valid, new_valid)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
