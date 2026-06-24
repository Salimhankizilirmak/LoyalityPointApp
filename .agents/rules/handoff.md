# HANDOFF — LoyaltyPointApp

> Bu dosya her oturum sonunda güncellenir. Yeni konuşmaya bu dosyayı yapıştırarak başla.

---

## Proje Özeti

**Stack:** Next.js 15+ App Router · Clerk (auth) · Turso/LibSQL · Drizzle ORM · Svix · Nodemailer · Tailwind · Framer Motion · Vercel  
**Roller:** Super Admin · Boss · Manager · Cashier · Customer  
**Mimari:** Container-Presenter · SOLID · multi-tenant B2B SaaS

---

## Son Oturum

**Tarih:** YYYY-MM-DD  
**Tamamlanan işler:**
- [ ] örnek: Clerk username sync endpoint yazıldı (`src/app/api/clerk/update-username/route.ts`)
- [ ] örnek: Cashier dashboard accepted customers listesi eklendi

**Değişen dosyalar:**
```
src/
  app/
    api/clerk/update-username/route.ts   → YENİ
    dashboard/cashier/page.tsx           → DEĞİŞTİ
  lib/
    constants/mock-data.ts               → DEĞİŞTİ
```

**Neden değişti (kısa):**
- `update-username/route.ts`: Phone → username propagation için Clerk API çağrısı
- `cashier/page.tsx`: Pending invitations kaldırıldı, accepted customers eklendi

---

## Bilinen Sorunlar / Askıdakiler

- [ ] Clerk username update API'den 422 dönüyor — araştırılacak
- [ ] Manager dashboard mobile responsive değil
- [ ] ...

---

## Sonraki Adım

1. ...
2. ...

---

## Donmuş Dosyalar (Dokunma)

> Bu dosyalara agent müdahale etmemeli.

- `src/lib/auth/permissions.ts`
- `src/middleware.ts`
- _(project.md'deki frozen list geçerli)_

---

## Önemli Kararlar / Standartlar

- Phone number = username (tüm roller)
- URL'lerde `NEXT_PUBLIC_APP_URL` kullanılır, localhost yasak
- Mock data merkezi: `src/lib/constants/mock-data.ts`
- Locale: `tr-TR`

---

_Son güncelleme: YYYY-MM-DD — [oturum özeti tek satır]_
