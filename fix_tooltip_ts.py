import re

file_path = "src/components/features/boss-dashboard/ui/BranchAnalytics.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("? currencyFormatter.format((entry.payload?.revenue ?? entry.value) / 100)", "? currencyFormatter.format(((entry as any).payload?.revenue ?? entry.value) / 100)")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
