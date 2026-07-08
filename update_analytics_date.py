import re

file_path = "src/lib/services/analytics-service.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Eski date logic
old_date = "strftime('%Y-%m-%d', (${loyaltyTransactions.createdAt} / 1000) + 10800, 'unixepoch')"

# Yeni date logic (Auto-detect saniye vs milisaniye)
new_date = "strftime('%Y-%m-%d', (CASE WHEN ${loyaltyTransactions.createdAt} > 9999999999 THEN ${loyaltyTransactions.createdAt} / 1000 ELSE ${loyaltyTransactions.createdAt} END) + 10800, 'unixepoch')"

content = content.replace(old_date, new_date)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
