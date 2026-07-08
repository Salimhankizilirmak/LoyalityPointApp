import re

file_path = "src/lib/services/analytics-service.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Eski condition'lar
old_start = "conditions.push(gte(loyaltyTransactions.createdAt, new Date(startDate)));"
old_end = "conditions.push(lte(loyaltyTransactions.createdAt, new Date(endDate)));"

# Yeni condition'lar (DB'deki veriyi her halükarda ms'ye cevirip js milisaniye ile kiyasla)
new_start = "conditions.push(sql`(CASE WHEN ${loyaltyTransactions.createdAt} > 9999999999 THEN ${loyaltyTransactions.createdAt} ELSE ${loyaltyTransactions.createdAt} * 1000 END) >= ${startDate}`);"
new_end = "conditions.push(sql`(CASE WHEN ${loyaltyTransactions.createdAt} > 9999999999 THEN ${loyaltyTransactions.createdAt} ELSE ${loyaltyTransactions.createdAt} * 1000 END) <= ${endDate}`);"

content = content.replace(old_start, new_start)
content = content.replace(old_end, new_end)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
