import re

file_path = "src/app/(manager)/manager-dashboard/client-page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# storeSettings'i dashboard.storeSettings üzerinden geçirelim
old_ts = """            <TransactionsSection 
              transactions={dashboard.transactions} cashiers={dashboard.cashiers}
              activityFeed={dashboard.activityFeed}
              isDarkMode={dashboard.isDarkMode}
              onEditTransaction={setEditingTransaction}
            />"""

new_ts = """            <TransactionsSection 
              transactions={dashboard.transactions} cashiers={dashboard.cashiers}
              activityFeed={dashboard.activityFeed}
              isDarkMode={dashboard.isDarkMode}
              onEditTransaction={setEditingTransaction}
              storeSettings={dashboard.storeSettings}
            />"""

content = content.replace(old_ts, new_ts)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
