import re

file_path = "src/app/(cashier)/cashier-dashboard/qr-invite/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('branchName="Bilinmeyen Şube"', 'branchName="QR Müşteri Kayıt"')
content = content.replace('branchName="Şube Bulunamadı"', 'branchName="QR Müşteri Kayıt"')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated page.tsx fallbacks")
