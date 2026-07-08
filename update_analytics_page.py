import re

file_path = "src/app/(boss)/boss-dashboard/analytics/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 'today' butonu ekle
old_map_start = '{(["7days", "30days", "custom"] as const).map((r) => {'
new_map_start = '{(["today", "7days", "30days", "custom"] as const).map((r) => {'

old_labels = 'const labels = { "7days": "1 Hafta", "30days": "1 Ay", custom: "Özel" };'
new_labels = 'const labels = { today: "Bugün", "7days": "1 Hafta", "30days": "1 Ay", custom: "Özel" };'

content = content.replace(old_map_start, new_map_start)
content = content.replace(old_labels, new_labels)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
