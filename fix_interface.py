import re

file_path = "src/components/features/boss-dashboard/ui/BranchAnalytics.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("payload?: { value: number; name: string }[];", "payload?: any[];")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
