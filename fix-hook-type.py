import re

file_path = "src/components/features/customer-dashboard/hooks/useCustomerDashboard.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('"cuzdan" | "islemler" | "profil"', '"cuzdan" | "islemler" | "profil" | "kampanyalar"')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated useCustomerDashboard.ts types")
