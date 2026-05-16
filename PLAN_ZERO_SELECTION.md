# PLAN: Zero-Selection Policy & Auto-Redirect Implementation

Bu plan, davetli kullanıcıların onboarding sürecini tamamen şeffaf hale getirmeyi ve yetkisiz erişimleri Middleware seviyesinde engellemeyi hedefler.

---

## 🏗️ Aşama 1: Kritik Hata Giderimi (Backend)
- [ ] **Action Fix:** `src/app/manager-dashboard/actions.ts` içindeki re-export hatasını gider. Fonksiyonları import edip `async` olarak tekrar export et.
- [ ] **Middleware Hardening:** `middleware.ts` içinde `/create-organization` rotasını sadece `boss` ve `super_admin` rolleri için açık tut. Diğerlerini `/unauthorized`'a postala.

## 🚀 Aşama 2: Zero-Selection & Auto-Sync (Backend + Security)
- [ ] **AuthUtils Redirect Logic:** `auth-utils.ts` içindeki yönlendirme mantığını güncelle. Eğer kullanıcı bir organizasyona bağlıysa (veya metadatada org_id varsa), Clerk'in organizasyon seçimini beklemeden doğrudan dashboard'a yönlendir.
- [ ] **Session Sync (Clerk):** Giriş yapıldığında `publicMetadata.org_id` değerini alıp Clerk SDK üzerinden `setActive` organizasyon olarak işaretleyecek mantığı (mümkünse client-side entry point veya middleware üzerinden) kurgula.

## 🎨 Aşama 3: UI Gating & Tasarım (Frontend)
- [ ] **UI Level Block:** `/create-organization` sayfasında Clerk `<CreateOrganization />` bileşenini sadece yetkili rollere göster.
- [ ] **CSS Warning Cleanup:** `globals.css` içindeki Tailwind v4 at-rules uyarılarını dindirmek için yapılandırmayı (postcss/tailwind.config) kontrol et veya standartlara çek.

## 🧪 Aşama 4: Doğrulama (Debugger + Security)
- [ ] **Invited User Test:** Bir Manager daveti kabul ettiğinde organizasyon seçmeden direkt dashboard'a düşüyor mu?
- [ ] **Security Audit:** Middleware engellemeleri atlatılabiliyor mu? (Direct URL access test).
