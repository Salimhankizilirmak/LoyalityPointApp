# HANDOFF — Okut Kazan

> Bu dosya her oturum sonunda güncellenir. Yeni konuşmaya bu dosyayı yapıştırarak başla.

---

## Proje Özeti

**Stack:** Next.js 16+ App Router · Clerk (auth) · Turso/LibSQL · Drizzle ORM · Svix · Nodemailer · Tailwind · Framer Motion · Vercel  
**Roller:** Super Admin · Boss · Manager · Cashier · Customer  
**Mimari:** Container-Presenter · SOLID · multi-tenant B2B SaaS

---

## Son Oturum (2026-07-06 — Güncel Oturum)

**Tamamlanan işler:**
- **Yetkilendirme ve Kasiyer Görünürlüğü (`staff-service.ts`):** `MANAGER` yetkisiyle girenlerin, `getOrgMembers` sorgusundan boş liste alması yetki sınırları düzeltilerek çözüldü. Artık şube yöneticileri yalnızca atandıkları şubedeki (pending veya accepted fark etmeksizin) personeli eksiksiz görebiliyor.
- **B2B Profesyonel Tasarım Standartları (`EmployeeManagement.tsx`):** Glow efektleri ve amatör metinler ("Harcattırdığı") kaldırılarak `/ui-ux-pro-max` onaylı B2B kurumsal görünüme (`bg-[#0F172A] border-slate-800`, "Harcama Hacmi") geçildi.
- **Kasiyer Avatar Güvenliği & Harf Logosu:** `imageURL` alanına clerk'ten düşen anlamsız string'lerin (`"??"`) kırık `<img>` yaratması önlendi. Resim sadece `http` içeriyorsa render ediliyor; aksi takdirde ismin baş harflerinden oluşan kurumsal bir İkon/Logo gösteriliyor.
- **İşlem Geçmişi Modalı:** "Detayları Gör" butonu entegre edildi. Tıklanıldığında kasiyerin yaptığı son 10 işlemi listeleyen, B2B renk şemasına sahip profesyonel bir modal eklendi.
- **Pasif Müşterilere Kampanya Maili (Cron Job + Send Queue):**
  - `customers` tablosuna `lastActiveAt` (timestamp) ve `campaigns` tablosuna `inactivityThresholdDays` eklendi.
  - Transaction sonrası (`earnPoints`, `burnPoints`, `voidTransaction`) `lastActiveAt` güncellenmesi entegre edildi.
  - Vercel function timeout ve SMTP rate limit sorunlarını aşmak için `campaign_sends` kuyruk tablosu eklendi.
  - `/api/cron/process-campaign-sends` Vercel cron job'ı yapılandırıldı ve test mailleri SMTP (Nodemailer) üzerinden başarıyla iletildi.

---

## Önceki Oturum (2026-07-04 — İkinci Oturum)

**Tamamlanan işler:**
- **Ekibim Sayfası (EmployeeManagement) — Kasiyer Kartları Zenginleştirildi:**
  - `Employee` tip tanımına `acceptedAt` (davet onay tarihi) ve `invitedCustomerCount` (davet ettiği müşteri sayısı) alanları eklendi.
  - `staff-service.ts` → `getOrgMembers` metoduna 2 yeni sorgu eklendi:
    1. `invitations` tablosundan `ACCEPTED` durumundaki kayıtlarla eşleştirme → `acceptedAt` verisi.
    2. `invitations` tablosunda `role = 'CUSTOMER'` ve `invitedBy = cashierId` koşullu `COUNT(*)` sorgusu → `invitedCustomerCount` verisi.
  - Kasiyer kartlarına **Davet Tarihi**, **Onay Tarihi**, **Toplam İşlem Sayısı**, **Davet Ettiği Müşteri** stat kutucukları eklendi.
  - Kartların altına **"Detayları Gör"** butonu eklendi (`onViewDetails?: (employeeId: string) => void` prop'u — şu anda no-op, ileride modal açılacak).
- **Müşteriler Sayfası (CustomerManagement) — Kart Sistemine Geçiş:**
  - Yatay satır listesi **glassmorphic 2×2 Grid kart yapısına** dönüştürüldü (`grid-cols-1 md:grid-cols-2`).
  - Arama placeholder'ı `"Telefon numarası ile ara..."` olarak güncellendi, neon dark temaya uyumlu hale getirildi.
  - Her kart: Avatar (glassmorphic) + Ad/Soyad + Telefon (mono) + E-posta + Genel Puan Bakiye (neon cyan) + Son İşlem/Şube Puan Katkısı stat kutucukları.
  - Arama yoksa son işlem yapan 4 müşteri gösterilir (mevcut mantık korundu).
- **Kampanyalar Sayfası (CampaignSection) — Split View Yeniden Tasarımı:**
  - `max-w-4xl` → `max-w-7xl` genişletildi, ekran verimli kullanılıyor.
  - **KPI Ribbon** eklendi (4 mini istatistik kartı): Mevcut Oran, Aktif Kampanya, Kalan Gün, Geçmiş Kampanya Sayısı.
  - **İki Sütunlu Grid** uygulandı: Sol sütun (Kazanım Oranı + Yeni Kampanya Formu), Sağ sütun (Aktif Kampanya + Geçmiş Kampanyalar).
  - **Renk paleti düzeltildi:** Slider track, geçmiş kampanya renkleri ve KPI gradient'ları Landing temasıyla (Indigo/Cyan neon) uyumlu hale getirildi.

---

## Önceki Oturum (2026-07-04 — İlk Oturum)

**Tamamlanan işler:**
- **Yönetici Paneli (Manager Dashboard) URL & Mimari Güncellemesi:**
  - Türkçe olan alt sayfa yolları İngilizce klasör standartlarına geçirildi (`/customers`, `/team`, `/campaigns`).
  - `UniversalSidebar` bileşenindeki aktif (active) sayfa işaretleyicisi düzeltildi, `/manager-dashboard` ana dizini ve alt sayfaların ayrımı yapıldı. Neon/gradient hover efektleri uygulandı.
- **Müşteriler Sayfası (CustomerManagement):**
  - Kullanıcı kartlarına telefon numarasının yanı sıra e-posta bilgisi eklendi.
  - Arama yapılmadığında varsayılan olarak yalnızca **son işlem yapan 4 müşteri** (işlem tarihine göre sıralanarak) gösterilecek şekilde performans ve UI algoritması yenilendi.
- **Ekibim Sayfası (EmployeeManagement & Davetler):**
  - Ayrı bir tablo olan `InvitationsAuditFeed` ("Canlı Davet Takip Paneli") kaldırılarak, tüm davet bekleyen personeller mevcut "Kasiyer/Ekip" kart dizaynına (`EmployeeManagement`) entegre edildi.
  - Kartlarda davet tarihi bilgisi gösterildi. Gereksiz "Kasiyer" rozeti kaldırılarak sadeleştirildi; sadece "Yönetici"ler (Manager) rozetle belirtildi.
  - "Yeni Kasiyer Ekle" davet kartı her zaman en başta görüntülenecek şekilde ayarlandı.

---

## Daha Önceki Oturum (2026-06-27)

**Tamamlanan işler:**
- Kasiyer Paneli Sidebar oluşturulması, İşlem/Müşteri sekmelerinin ayrı sayfalara ayrıştırılması.
- Full Table Scan performans düzeltmesi (B-Tree uyumlu `eq` sorgusuna geçiş).

---

## Bilinen Sorunlar / Askıdakiler

- Bilinen hiçbir derleme, tip veya linter hatası kalmamıştır. `npx tsc --noEmit` → 0 Hata.

---

## Sonraki Adım

1. `invitedCustomerCount` counter'ının ileride `staffProfiles` tablosuna kolon olarak eklenmesi (şu anda `COUNT(*)` live query kullanılıyor — performans profiline göre migration planlanacak).

---

## Donmuş Dosyalar (Dokunma)

> Bu dosyalara agent müdahale etmemeli.

- `src/lib/auth/permissions.ts`
- _(project.md'deki frozen list geçerli)_

---

## Önemli Kararlar / Standartlar

- **İngilizce Routing Standartı:** Dosya ve URL rotaları her zaman İngilizce olmalıdır (Örn. `/musteriler` yerine `/customers`).
- Phone number = username (tüm roller için veritabanında `05XXXXXXXXX` düz format)
- Giriş yaparken Clerk'e gönderilen identifier = `+905XXXXXXXXX` uluslararası format
- URL'lerde `NEXT_PUBLIC_APP_URL` kullanılır, localhost yasak
- E-postalar invitations tablosuna strictly lowercase (`.trim().toLowerCase()`) kaydedilmeli, status sorgularında LOWER kalkanı korunmalıdır.
- JIT senkronizasyonu sadece ilk kayıt mantığına sahip olmalı, username güncellemeleri JIT set bloğundan uzak tutulmalıdır.
- Locale: `tr-TR`
- **Tasarım İlkesi:** 3D butonlar ve ağır animasyonlu "Framer Motion" bileşenlerinde mutlaka mobil cihazlar (`isMobile` state'i) için Graceful Degradation kontrolü olmalıdır.
- **Kasiyer İstatistikleri:** `invitedCustomerCount` şu anda Live Count (`COUNT(*)`) ile hesaplanıyor. İleride `staffProfiles` tablosuna counter kolon eklenecek.
- **Müşteri Sayfası:** Ekibim kart yapısıyla tutarlı glassmorphic 2×2 Grid. Arama yoksa max 4 müşteri, scroll yok.
- **Kampanyalar Sayfası:** Split View düzeni (KPI Ribbon + İki Sütunlu Grid), Landing temasıyla (Indigo/Cyan) uyumlu renk paleti.

---

_Son güncelleme: 2026-07-06 — B2B Tasarım standartları, Avatar/Icon güvenliği, Yetkilendirme hataları ve Modal geliştirmeleri tamamlandı._
