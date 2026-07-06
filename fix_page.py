import re

with open('src/app/(manager)/manager-dashboard/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('ManagerDashboardClient', 'OverviewClient')

# Remove getCustomers, getOrgMembers, getInvitationsAction calls
old_fetch = '''  const [profile, txs, invitesList, custs, emps] = await Promise.all([
    safeFetch(getManagerProfile()),
    safeFetch(getBranchTransactions()),
    safeFetch(getInvitationsAction()),
    safeFetch(getCustomers("")),
    safeFetch(getOrgMembers())
  ]);

  return (
    <OverviewClient 
      initialManagerName={managerName}
      initialBranchName={branchName}
      initialData={{
        profile,
        transactions: txs,
        invitations: invitesList,
        customers: custs,
        members: emps
      }}
    />
  );'''

new_fetch = '''  const [profile, txs, emps] = await Promise.all([
    safeFetch(getManagerProfile()),
    safeFetch(getBranchTransactions()),
    safeFetch(getOrgMembers()) // Transactions needs cashiers
  ]);

  return (
    <OverviewClient 
      initialManagerName={managerName}
      initialBranchName={branchName}
      initialData={{
        profile,
        transactions: txs,
        members: emps
      }}
    />
  );'''

content = content.replace(old_fetch, new_fetch)

with open('src/app/(manager)/manager-dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

