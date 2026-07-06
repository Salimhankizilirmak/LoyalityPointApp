import re

with open('src/components/features/manager-dashboard/sections/StaffSection.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove InvitationsAuditFeed import
content = re.sub(r'import \{ InvitationsAuditFeed \} from "@/components/features/invitations/ui/InvitationsAuditFeed";\n', '', content)

# Map invitations and combine
old_render = '''export function StaffSection({
  cashiers,
  isDarkMode,
  handleUpdateCashier,
  handleRemoveCashier,
  handleToggleStatus,
  setShowInvite,
  loadingId,
  invitations
}: StaffSectionProps) {
  return (
    <div className="space-y-6">
      <div className="glass-panel-elevated rounded-3xl p-8 transition-all">
        <EmployeeManagement
          employees={cashiers}'''

new_render = '''export function StaffSection({
  cashiers,
  isDarkMode,
  handleUpdateCashier,
  handleRemoveCashier,
  handleToggleStatus,
  setShowInvite,
  loadingId,
  invitations
}: StaffSectionProps) {
  
  const pendingInvitations: Employee[] = invitations.map(inv => ({
    id: inv.id,
    name: inv.email.split("@")[0],
    email: inv.email,
    role: inv.role === "admin" ? "manager" : "cashier",
    status: "pending",
  }));

  const allEmployees = [...cashiers, ...pendingInvitations];

  return (
    <div className="space-y-6">
      <div className="glass-panel-elevated rounded-3xl p-8 transition-all">
        <EmployeeManagement
          employees={allEmployees}'''

content = content.replace(old_render, new_render)

# Remove the InvitationsAuditFeed component usage
old_audit_feed = '''      </div>
      <div className="mt-8">
        <InvitationsAuditFeed invitations={invitations} isDarkMode={isDarkMode} />
      </div>
    </div>'''

new_audit_feed = '''      </div>
    </div>'''

content = content.replace(old_audit_feed, new_audit_feed)

with open('src/components/features/manager-dashboard/sections/StaffSection.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

