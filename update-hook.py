import re

file_path = "src/components/features/cashier-dashboard/hooks/useCashierDashboard.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# State'i guncelle: ptsBurnedToday ekle
old_state = """  const [stats, setStats] = useState({
    totalTxToday: 0,
    ptsGivenToday: 0,
    newMembersToday: 0
  });"""

new_state = """  const [stats, setStats] = useState({
    totalTxToday: 0,
    ptsGivenToday: 0,
    ptsBurnedToday: 0,
    newMembersToday: 0
  });"""

content = content.replace(old_state, new_state)

# FetchStats icini guncelle
old_fetch = """        if (res.success && res.stats) {
          setStats(s => ({
            ...s,
            totalTxToday: res.stats.todayTxCount,
            newMembersToday: res.stats.todayNewCustomers,
            ptsGivenToday: res.stats.totalRevenue
          }));
        }"""

new_fetch = """        if (res.success && res.stats) {
          setStats(s => ({
            ...s,
            totalTxToday: res.stats.todayTxCount,
            newMembersToday: res.stats.todayNewCustomers,
            ptsGivenToday: res.stats.totalRevenue,
            ptsBurnedToday: res.stats.totalBurned || 0
          }));
        }"""

content = content.replace(old_fetch, new_fetch)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

