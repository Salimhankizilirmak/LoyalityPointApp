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
