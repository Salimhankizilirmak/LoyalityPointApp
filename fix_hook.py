import re

with open('src/components/features/manager-dashboard/hooks/useManagerDashboard.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove activeTab state and URL effect
content = re.sub(r'  const \[activeTab, setActiveTab\] = useState\(\(\) => \{.*?\n  \}\);\n', '', content, flags=re.DOTALL)
content = re.sub(r'  useEffect\(\(\) => \{\n.*?setActiveTab\(\d\);\n    else setActiveTab\(0\);\n  \}, \[pathname\]\);\n', '', content, flags=re.DOTALL)

# Also remove activeTab from return
content = content.replace('    activeTab,\n    setActiveTab,\n', '')

# Replace cashiers useState to include mapped invitations
old_cashiers_state = '''  const [cashiers, setCashiers] = useState<Employee[]>(() => {
    if (initialData?.members) {
      return (initialData.members as Employee[]).filter(e => e.role === "cashier");
    }
    return [];
  });'''

new_cashiers_state = '''  const [cashiers, setCashiers] = useState<Employee[]>(() => {
    let baseCashiers: Employee[] = [];
    if (initialData?.members) {
      baseCashiers = (initialData.members as Employee[]).filter(e => e.role === "cashier");
    }
    const pendingInvites: Employee[] = (initialData?.invitations || []).map((inv: any) => ({
      id: inv.id,
      name: inv.email.split("@")[0],
      email: inv.email,
      role: inv.role === "admin" ? "manager" : "cashier",
      status: "pending",
      avatar: "",
      createdAt: inv.createdAt,
    }));
    return [...baseCashiers, ...pendingInvites];
  });'''

content = content.replace(old_cashiers_state, new_cashiers_state)

# Replace refreshData cashiers set to include mapped invitations
old_refresh = '''      // Sadece kasiyerleri filtrele
      const filteredCashiers = (emps as Employee[]).filter(e => e.role === "cashier");
      setCashiers(filteredCashiers);'''

new_refresh = '''      // Kasiyerleri ve davetleri filtreleyip birleştir
      const filteredCashiers = (emps as Employee[]).filter(e => e.role === "cashier");
      const pendingInvites: Employee[] = invitesList.map((inv: any) => ({
        id: inv.id,
        name: inv.email.split("@")[0],
        email: inv.email,
        role: inv.role === "admin" ? "manager" : "cashier",
        status: "pending",
        avatar: "",
        createdAt: inv.createdAt,
      }));
      setCashiers([...filteredCashiers, ...pendingInvites]);'''

content = content.replace(old_refresh, new_refresh)

with open('src/components/features/manager-dashboard/hooks/useManagerDashboard.ts', 'w', encoding='utf-8') as f:
    f.write(content)

