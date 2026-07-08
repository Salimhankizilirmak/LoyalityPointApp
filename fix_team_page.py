import re

cp_path = "src/app/(boss)/boss-dashboard/team/client-page.tsx"
with open(cp_path, "r", encoding="utf-8") as f:
    cp_content = f.read()

# Edit and Trash2 title prop'lari kaldir
cp_content = re.sub(r'<Edit\s+className="([^"]+)"\s+title="[^"]*"\s*/>', r'<Edit className="\1" />', cp_content)
cp_content = re.sub(r'<Trash2\s+className="([^"]+)"\s+title="[^"]*"\s*/>', r'<Trash2 className="\1" />', cp_content)

with open(cp_path, "w", encoding="utf-8") as f:
    f.write(cp_content)

sm_path = "src/app/actions/staff-management.ts"
with open(sm_path, "r", encoding="utf-8") as f:
    sm_content = f.read()

sm_content = re.sub(r'organizationId:\s*userOrganizationId,', '', sm_content)

with open(sm_path, "w", encoding="utf-8") as f:
    f.write(sm_content)

an_path = "src/components/features/boss-dashboard/ui/BranchAnalytics.tsx"
with open(an_path, "r", encoding="utf-8") as f:
    an_content = f.read()

an_content = an_content.replace("{payload.map((entry, index) => (", "{payload.map((entry: any, index: number) => (")

with open(an_path, "w", encoding="utf-8") as f:
    f.write(an_content)

