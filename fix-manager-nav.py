import re

file_path = "src/app/(manager)/manager-dashboard/layout-client.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the customers nav item line
line_to_remove = r'\s*\{ name: "Müşteriler", href: "/manager-dashboard/customers", icon: require\("lucide-react"\)\.Users \},'

content = re.sub(line_to_remove, "", content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

