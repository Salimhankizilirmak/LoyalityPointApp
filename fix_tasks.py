with open('.gemini/antigravity/brain/0c4b5636-457b-4404-9807-4cde522b4c25/task.md', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '- [ ] `layout-client.tsx` arka plan/tema sarmalayıcısı güncellenecek.',
    '- [x] `layout-client.tsx` arka plan/tema sarmalayıcısı güncellenecek.'
).replace(
    '- [ ] `useManagerDashboard.ts` içindeki `activeTab` mantığı kaldırılacak, `invitations` veri dönüşümü (`pendingInvitations`) buraya taşınacak.',
    '- [x] `useManagerDashboard.ts` içindeki `activeTab` mantığı kaldırılacak, `invitations` veri dönüşümü (`pendingInvitations`) buraya taşınacak.'
)

with open('.gemini/antigravity/brain/0c4b5636-457b-4404-9807-4cde522b4c25/task.md', 'w', encoding='utf-8') as f:
    f.write(content)
