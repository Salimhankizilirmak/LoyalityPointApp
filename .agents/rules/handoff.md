# HANDOFF — LoyaltyPointApp

> Bu dosya her oturum sonunda güncellenir. Yeni konuşmaya bu dosyayı yapıştırarak başla.

---

## Proje Özeti

**Stack:** Next.js 16+ App Router · Clerk (auth) · Turso/LibSQL · Drizzle ORM · Svix · Nodemailer · Tailwind · Framer Motion · Vercel  
**Roller:** Super Admin · Boss · Manager · Cashier · Customer  
**Mimari:** Container-Presenter · SOLID · multi-tenant B2B SaaS

---

## Son Oturum (2026-06-25)

**Tamamlanan işler:**
- **KVKK Aydınlatma Metni Sayfası (`src/app/kvkk/page.tsx`):**
  - Public (kimlik doğrulama gerektirmeyen) erişimli olarak Next.js App Router Server Component standartlarında oluşturuldu.
  - Arama motorlarında indekslenmeyi önlemek amacıyla `export const metadata = { robots: "noindex, nofollow" }` tanımı strictly eklendi.
  - "Topla Kazan" koyu tema vizyonuna (neutral-950, Indigo ve Cyan esintileri) uygun responsive ve premium tasarımla kodlandı.
  - `src/middleware.ts` dosyasındaki `isPublicRoute` rotalarına `/kvkk` eklenerek Clerk auth korumasından muaf tutuldu.
- **Nodemailer B2B E-Posta Davet Şablonu Entegrasyonu:**
  - `src/lib/services/email-service.ts` dosyasında `sendMail` metoduna `text` (Plain-Text fallback) desteği eklendi. `from` alanı strictly `process.env.SMTP_USER` çevre değişkeninden dinamik alınacak şekilde güncellendi.
  - `src/lib/templates/email-templates.ts` dosyasında `getBossInvitationTemplate` şablonu B2B standartlarına göre inline CSS barındıran, harici resim/logo içermeyen premium koyu tema ile yenilendi. KVKK metni dinamik olarak `/kvkk` linkine bağlandı.
  - `src/lib/services/admin-service.ts` içindeki `inviteBoss` ve `transferCompanyOwnership` metotları Plain-Text fallback ve konu başlıklarıyla güncellendi.
- **JIT Senkronizasyonu & Hata Kalkanları (`src/app/api/auth/status/route.ts`):**
  - JIT kayıt mantığındaki veritabanı insert işlemi `try-catch` kalkanına alındı. `users.username` benzersizlik hatasında (UNIQUE constraint failed) kullanıcı adı strictly `${finalUsername}_${userId.slice(-4)}` yapılarak kurtarma ve JIT çökmesini engelleme desteği eklendi.
  - JIT `onConflictDoUpdate` bloğundan `username` alanı tamamen kaldırılarak `COALESCE` yan etkileri ve kimlik tutarsızlıkları engellendi.
  - `invitations` tablosundaki e-posta sorgusunda büyük/küçük harf kaçaklarını (query-miss) engellemek amacıyla `LOWER` kalkanı geri getirilip korundu.
  - Davet bulunamazsa veritabanına uydurma veri eklenmesi engellendi ve doğrudan `403 Forbidden` ile `{ synced: false, error: "INVITATION_NOT_FOUND" }` dönülmesi sağlandı.
- **Hayalet Oturum Döngüsü Kalkanı (Ghost Session Shield - `src/app/auth-callback/page.tsx`):**
  - Davetiye bulunamadığı durumda (`invitationError: true`), arka planda sessizce ve otomatik olarak Clerk `signOut()` çağrısı yapan bir kalkan kuruldu.
  - Clerk `signOut` referans stabilitesinin bozulması durumunda re-render döngülerini engellemek amacıyla strictly `useRef` kararlılık kalkanı (`hasSignedOut.current = true`) entegre edildi.
  - Oturum sonlandırılırken arayüzün kilitlenmesi veya erken yönlendirme yapılması `isLoaded && !isSignedIn && !invitationError` kuralı ile engellendi.
- **Kalite Kontrolü:** Proje `npm run build` ve `npm run lint` testlerinden sıfır hata ile geçerek stabil hale getirildi.

**Değişen dosyalar:**
```
src/
  app/
    kvkk/page.tsx                                    → YENİ
    api/auth/status/route.ts                         → GÜNCELLENDİ
    auth-callback/page.tsx                           → GÜNCELLENDİ
    admin/actions.ts                                 → GÜNCELLENDİ
  lib/
    services/
      email-service.ts                               → GÜNCELLENDİ
      admin-service.ts                               → GÜNCELLENDİ
    templates/
      email-templates.ts                             → GÜNCELLENDİ
  middleware.ts                                      → GÜNCELLENDİ
```

---

## Bilinen Sorunlar / Askıdakiler

- Bilinen hiçbir derleme, tip veya linter hatası kalmamıştır. Tüm testler yeşildir (0 Hata).

---

## Sonraki Adım

1. Canlı/Vercel ortamında Clerk JIT senkronizasyonunu ve `/kvkk` sayfa erişimini uçtan uca test et.
2. Davet e-postalarının plain-text fallback uyumluluğunu e-posta istemcileri üzerinden doğrula.

---

## Donmuş Dosyalar (Dokunma)

> Bu dosyalara agent müdahale etmemeli.

- `src/lib/auth/permissions.ts`
- _(project.md'deki frozen list geçerli)_

---

## Önemli Kararlar / Standartlar

- Phone number = username (tüm roller için veritabanında `05XXXXXXXXX` düz format)
- Giriş yaparken Clerk'e gönderilen identifier = `+905XXXXXXXXX` uluslararası format
- URL'lerde `NEXT_PUBLIC_APP_URL` kullanılır, localhost yasak
- E-postalar invitations tablosuna strictly lowercase (`.trim().toLowerCase()`) kaydedilmeli, status sorgularında LOWER kalkanı korunmalıdır.
- JIT senkronizasyonu sadece ilk kayıt mantığına sahip olmalı, username güncellemeleri JIT set bloğundan uzak tutulmalıdır.
- Locale: `tr-TR`

---

_Son güncelleme: 2026-06-25 — KVKK Aydınlatma Metni eklendi, B2B Nodemailer Plain-Text şablonu güncellendi, JIT 500 hataları & UNIQUE çakışmaları engellendi ve useRef kararlılık kalkanıyla hayalet oturumlar sonlandırıldı._
