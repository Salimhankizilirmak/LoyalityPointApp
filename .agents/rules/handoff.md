# HANDOFF — LoyaltyPointApp

> Bu dosya her oturum sonunda güncellenir. Yeni konuşmaya bu dosyayı yapıştırarak başla.

---

## Proje Özeti

**Stack:** Next.js 16+ App Router · Clerk (auth) · Turso/LibSQL · Drizzle ORM · Svix · Nodemailer · Tailwind · Framer Motion · Vercel  
**Roller:** Super Admin · Boss · Manager · Cashier · Customer  
**Mimari:** Container-Presenter · SOLID · multi-tenant B2B SaaS

---

## Son Oturum

**Tarih:** 2026-06-24  
**Tamamlanan işler:**
- `src/components/auth/auth-modal.tsx` dosyasındaki React Hook sırası hatası unconditional `useTransform` tanımlarıyla çözüldü.
- Clerk v7 ve React 19 ile uyumluluk sağlanması amacıyla asenkron auth hook'ları (`useSignIn`, `useSignUp`) güncellendi; `isLoaded` ve `setActive` metotları `useAuth()` ve `useClerk()` üzerinden çekildi.
- Telefon numarası mühürleme ve doğrulama akışındaki `"u"` ve `"u0"` önekleri (prefix) tamamen kaldırıldı. Giriş kutusu strictly telefon odaklı hale getirildi. Girişte `+905XXXXXXXXX` uluslararası formatına dönüştürüldü.
- Google SSO yönlendirme akışı için `/sso-callback` karşılama sayfası sıfırdan oluşturuldu.
- Clerk Webhook motoru (`route.ts`) güncellenerek yerel veritabanına `05XXXXXXXXX` formatında `username` kaydedilirken, Clerk profiline doğrulanmış telefon numarası (`+905XXXXXXXXX`) mühürlenmesi entegre edildi.
- Clerk Webhook isteklerinin middleware tarafından engellenmemesi için `src/middleware.ts` içindeki public matcher'a `/api/webhooks/clerk(.*)` muafiyeti tanımlandı.
- `npm run build` ile projenin sorunsuz derlendiği doğrulandı.

**Değişen dosyalar:**
```
src/
  components/auth/auth-modal.tsx     → DEĞİŞTİ
  app/
    sso-callback/page.tsx            → YENİ
    api/webhooks/clerk/route.ts      → DEĞİŞTİ
  middleware.ts                      → DEĞİŞTİ
```

**Neden değişti (kısa):**
- `auth-modal.tsx`: Hook sırası hatası tamiri, Clerk v7 uyumlu ref'ler, +90 telefon girdisi ve davet onayında u0 temizliği.
- `page.tsx` (sso-callback): Google SSO sonrası Clerk oturumu doğrulama karşılama sayfası.
- `route.ts` (webhook): Düz 11 haneli yerel numara ile DB sync, uluslararası numara ile Clerk phoneNumbers doğrulaması.
- `middleware.ts`: Webhook arka plan isteklerinin Sign-in sayfasına yönlenmesini önleyen public rota tanımı.

---

## Bilinen Sorunlar / Askıdakiler

- Bilinen bir build veya çalışma zamanı hatası kalmadı.

---

## Sonraki Adım

1. Canlı ortamda (Vercel) Clerk Webhook tetiklemelerini ve Google SSO akışını uçtan uca test et.
2. İşletme kuralları gereği telefon numarasının doğruluğunu ve veritabanı kayıt bütünlüğünü doğrula.

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
- Locale: `tr-TR`

---

_Son güncelleme: 2026-06-24 — Google SSO aktifleşti, 'u' prefix temizlendi ve Clerk v7/middleware entegrasyonu tamamlandı._
