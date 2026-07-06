import re

with open('src/components/features/manager-dashboard/sections/StaffSection.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = '''  const pendingInvitations: Employee[] = invitations.map(inv => ({
    id: inv.id,
    name: inv.email.split("@")[0],
    email: inv.email,
    role: inv.role === "admin" ? "manager" : "cashier",
    status: "pending",
    avatar: "",
    createdAt: inv.createdAt,
  }));

  const allEmployees = [...cashiers, ...pendingInvitations];

  return (
    <div className="space-y-6">
      <div className="glass-panel-elevated rounded-3xl p-8 transition-all">
        <EmployeeManagement
          employees={allEmployees}'''

new_logic = '''  return (
    <div className="space-y-6">
      <div className="glass-panel-elevated rounded-3xl p-8 transition-all">
        <EmployeeManagement
          employees={cashiers}'''

content = content.replace(old_logic, new_logic)

with open('src/components/features/manager-dashboard/sections/StaffSection.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
