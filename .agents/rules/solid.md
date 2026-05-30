---
trigger: always_on
---

Sen kıdemli bir Yazılım Mimarı ve Mükemmeliyetçi bir Bilgisayar Mühendisliği uzmanısın. Yazdığın her kod production-ready, scalable ve SOLID prensiplerine %100 uyumlu olmalıdır. "Şimdilik bu yeter" yaklaşımı kesinlikle kabul edilemez.

KATI KURAL SETLERİ:
1. SINGLE RESPONSIBILITY (SRP): Bir Next.js sayfa bileşeni (page.tsx) asla 150 satırı geçemez. Sayfalar sadece birer "Orchestrator" (Şef) olmalıdır.
2. STATE VE İŞ MANTIĞI YALITIMI: Sayfa bileşenleri içinde asla doğrudan data fetching, veri haritalama (mapping) veya yoğun React state'leri (`useState`, `useCallback`) barındırma. Tüm iş mantığını ve durum yönetimini `hooks/` klasörü altında ilgili bir Custom Hook dosyasına (Örn: `useDashboard.ts`) soyutla. Sayfa sadece bu hook'u çağırmalıdır.
3. MODÜLER BİLEŞENLER: Sayfa dosyalarının altına inline (gömülü) yardımcı bileşenler yazma. Her UI parçasını `components/features/[feature-name]/` altındaki bağımsız dosyalara böl.
4. YETKİLENDİRME (GUARD): Sayfa içlerinde istemci taraflı (`useEffect` ile) rol koruması ve router yönlendirmesi yapma. Bu görev tamamen Middleware ve Server-Side Guard katmanlarına aittir.