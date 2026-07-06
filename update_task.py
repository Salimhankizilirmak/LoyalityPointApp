with open('.gemini/antigravity/brain/0c4b5636-457b-4404-9807-4cde522b4c25/task.md', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('- [ ] `manager-dashboard/page.tsx` (Ana Sayfa) sadece `Transactions` için veri çekecek şekilde sadeleştirilecek ve `OverviewClient` bileşeni oluşturulacak.', '- [x] `manager-dashboard/page.tsx` (Ana Sayfa) sadece `Transactions` için veri çekecek şekilde sadeleştirilecek ve `OverviewClient` bileşeni oluşturulacak.')
content = content.replace('- [ ] `manager-dashboard/customers/page.tsx` bağımsız bir sayfa olarak oluşturulacak ve `CustomersClient` eklenecek.', '- [x] `manager-dashboard/customers/page.tsx` bağımsız bir sayfa olarak oluşturulacak ve `CustomersClient` eklenecek.')
content = content.replace('- [ ] `manager-dashboard/team/page.tsx` bağımsız bir sayfa olarak oluşturulacak ve `TeamClient` eklenecek.', '- [x] `manager-dashboard/team/page.tsx` bağımsız bir sayfa olarak oluşturulacak ve `TeamClient` eklenecek.')
content = content.replace('- [ ] `manager-dashboard/campaigns/page.tsx` bağımsız bir sayfa olarak oluşturulacak ve `CampaignsClient` eklenecek.', '- [x] `manager-dashboard/campaigns/page.tsx` bağımsız bir sayfa olarak oluşturulacak ve `CampaignsClient` eklenecek.')
content = content.replace('- [ ] `StaffSection.tsx` içerisindeki eski veri dönüşüm mantığı silinecek.', '- [x] `StaffSection.tsx` içerisindeki eski veri dönüşüm mantığı silinecek.')

with open('.gemini/antigravity/brain/0c4b5636-457b-4404-9807-4cde522b4c25/task.md', 'w', encoding='utf-8') as f:
    f.write(content)
