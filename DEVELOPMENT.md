# Geliştirme Süreci (DEVELOPMENT.md)

Bu dosya, "Loyalty & Points" projesinin geliştirme sürecindeki adımları, alınan kararları ve mimari yapıları loglamak için oluşturulmuştur.

## Aşama 1: Proje Kurulumu ve Altyapı
- **Next.js 14/15 App Router** tabanlı proje iskeleti oluşturuldu (`create-next-app`).
- **Tailwind CSS** varsayılan olarak entegre edildi.
- API anahtarlarının eklenebileceği `.env.local` şablonu oluşturuldu.

**Mimari Kararlar:**
- Uygulama "Tek Çatı (Role-based Routing)" mimarisi ile kurgulanacak. Farklı paneller ayrı siteler değil, aynı proje altında yetkiye göre değişen modüller olacak.
- Puan küsurat problemini çözmek için DB'de "integer" tabanlı kuruş mantığı (12.55 Puan = 1255 DB değeri) kullanılacak.
- Süper admin yetkileri Clerk `publicMetadata` içinde `role: "superadmin"` olarak tutulacak. Belirli mailler (aleprensongut, vb.) için middleware whitelist koruması eklenecek.
- Gizli bir URL ile Süper Admin login/ekleme paneli kurgulanacak.

## Aşama 2: GitHub Entegrasyonu, Veritabanı Push İşlemi ve Yönetici Panelleri
- **GitHub Entegrasyonu:** `git init` yapılarak projenin iskeleti ve temel yapılandırmaları github.com/Salimhankizilirmak/LoyalityPointApp reposuna yüklendi.
- **Turso/Drizzle Push:** Oluşturulan DB şeması (Müşteriler ve İşlemler) `npx drizzle-kit push` komutuyla Turso'ya başarıyla yansıtıldı.
- **Süper Admin Paneli:** `/sys-core-admin-7f9a2b8c` rotasında Server Actions ve Clerk API (createOrganization) kullanılarak yeni firma ekleme ekranı geliştirildi. Tasarımda Framer Motion ve glassmorphism kullanıldı.
- **Patron Paneli:** `/boss-dashboard` rotasında Clerk Organizations bileşenleri (`OrganizationSwitcher`, `OrganizationProfile`) özelleştirilerek patronun firma ve çalışanları yönetebileceği şık bir arayüz kurgulandı.

## Aşama 3: Landing Page, Paneller ve QR Entegrasyonu
- **Premium Landing Page:** `src/app/page.tsx` rotasında, Apple/SaaS standartlarında, Framer Motion efektleriyle donatılmış, göz alıcı bir açılış sayfası tasarlandı. Kayıt/Giriş butonları doğrudan Clerk modallerini tetikliyor.
- **Rol Bazlı Yönlendirme:** `/dashboard` ortak rotası kurgulandı. Kullanıcılar giriş yaptıklarında buraya düşüyor ve Clerk rollerine/Organizasyon bilgilerine göre ilgili panele yönlendiriliyorlar.
- **Müşteri Paneli:** `/customer-dashboard` sayfası eklendi. Müşterinin eşsiz Clerk ID'sinden oluşan `qrcode.react` tabanlı bir QR kod ve güncel bakiye göstergesi yerleştirildi. Müşteri ilk giriş yaptığında Clerk'ten alınan bilgilerle Turso veritabanına otomatik senkronizasyon (ngrok/webhook kullanmadan, ilk giriş anında) sağlandı.
- **Kasiyer Paneli:** `/cashier-dashboard` sayfası geliştirildi. İki sekmeli yapıda kurgulandı. Kasiyer `Clerk Invitation API` kullanarak yeni müşteri ekleyebiliyor ve `@yudiel/react-qr-scanner` kamerasıyla okuttuğu müşteriye puan ekleme (%10 kuralıyla) / harcama yapabiliyor.
- **Yönetici Paneli:** `/manager-dashboard` sayfasıyla, yöneticinin kendi şubesindeki tüm işlemleri (kasiyerin kime kaç puan verdiği) görebilmesi sağlandı. Hatalı durumlarda "Manuel Düzeltme" butonu ile yetkili olarak puan güncellemesi yapabilme özelliği getirildi.

