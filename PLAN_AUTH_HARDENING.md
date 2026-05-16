# PLAN: Auth Flow Hardening & Role Enforcement

Bu plan, giriş sonrası yönlendirmelerin hızlandırılmasını ve yetkisiz erişimlerin (organizasyon kurma dahil) tamamen engellenmesini hedefler.

---

## 🚀 Aşama 1: Doğrudan Yönlendirme (Direct Routing)
- [ ] **Env Update:** `.env.local` dosyasındaki `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` değerini `/dashboard` olarak bırakıp, `/dashboard/page.tsx` içindeki "yükleniyor" aşamasını minimize ederek doğrudan yönlendirmeyi sağla.
- [ ] **Middleware Optimization:** Middleware seviyesinde, eğer kullanıcı login olmuşsa ve metadata'sında gidilecek dashboard belliyse, `/dashboard`'a uğramadan oraya gitmesini sağla.

## 🛡️ Aşama 2: Organizasyon Kurma Bariyeri (Org Creation Gating)
- [ ] **Hard Gate:** `/create-organization` rotasını hem Middleware hem de UI seviyesinde sadece `superadmin` ve davet edilmiş `boss` (rolü boss olup henüz orgId'si olmayan) kullanıcılar için aç.
- [ ] **Redirection:** Silinen veya rolsüz kullanıcıları Clerk'in varsayılan ekranlarına bırakma; doğrudan `/unauthorized` veya `/waiting-approval` sayfasına yönlendir.

## 🎭 Aşama 3: Rol Modeli Temizliği (Role Enforcement)
- [ ] **Metadata Audit:** Tüm servislerde (BaseService.requireRole) rol kontrolünü katılaştır. `null` veya bilinmeyen rollere hiçbir yetki verme.
- [ ] **AuthUtils Refactor:** `getDashboardRedirectPath` fonksiyonunu, kullanıcının rolü yoksa otomatik `/unauthorized` döndürecek şekilde güncelle.

## 🛠️ Aşama 4: Hata Giderme (Bug Fix)
- [ ] **Boss Permission Error:** `getAllBossOrganizations` action'ındaki "Gerekli roller: boss" hatasını incele. Metadata senkronizasyon gecikmesini (Clerk sync delay) yönetmek için cache invalidation veya retry mantığı ekle.

## 🧪 Aşama 5: Doğrulama (Verification)
- [ ] **Guest Test:** Giriş yapmamış kullanıcı sadece public sayfalara erişebiliyor mu?
- [ ] **Deleted User Test:** Silinen kullanıcı sisteme girdiğinde hiçbir buton görmeden `/unauthorized` sayfasına düşüyor mu?
