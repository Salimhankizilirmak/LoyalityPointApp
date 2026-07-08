import re

file_path = "src/components/features/cashier-dashboard/CashierDashboardClient.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# isFormValid mantığını bul ve güncelle
old_valid = "const isFormValid = form.phone.length === 10 && form.phone.startsWith(\"5\");"
new_valid = "const isFormValid = form.firstName.trim() !== \"\" && form.lastName.trim() !== \"\" && form.phone.length === 10 && form.phone.startsWith(\"5\");"
content = content.replace(old_valid, new_valid)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

# InviteCustomerCard UI'ı güncelle
ui_file = "src/components/features/cashier-dashboard/ui/InviteCustomerCard.tsx"
with open(ui_file, "r", encoding="utf-8") as f2:
    ui_content = f2.read()

ui_content = ui_content.replace('<label className={labelClass}>Ad</label>', '<label className={labelClass}>Ad *</label>')
ui_content = ui_content.replace('<label className={labelClass}>Soyad</label>', '<label className={labelClass}>Soyad *</label>')

with open(ui_file, "w", encoding="utf-8") as f2:
    f2.write(ui_content)
