# PLAN: Manager Management & Data Isolation Hardening

Bu plan, yöneticilerin tam silinmesi, şube bazlı veri izolasyonu ve şube değiştirme yeteneklerini kapsar.

---

## 🏗️ Aşama 1: Veritabanı ve Silme Protokolü (Database + Security)
- [ ] **DB Purge:** `member-service.ts` içindeki `removeMember` fonksiyonuna, Clerk işlemlerinin yanı sıra yerel `users` tablosundan da kaydı silen mantığı ekle.
- [ ] **Cascading Check:** Kullanıcı silindiğinde ona bağlı (eğer varsa) ilişkili verilerin durumunu kontrol et.

## 🚀 Aşama 2: Veri İzolasyonu ve Sıkılaştırma (Backend)
- [ ] **Manager Isolation:** `src/lib/services/manager-service.ts` içindeki tüm metodların `this.requireOrg()` üzerinden gelen `orgId` ile SQL seviyesinde filtrelendiğinden emin ol.
- [ ] **Auth Bypass Prevention:** Manager Dashboard action'larının Boss veya SuperAdmin yetkisiyle manipüle edilip edilemediğini denetle.

## 🔄 Aşama 3: Şube Değiştirme (Reassignment) (Backend + Frontend)
- [ ] **Reassign Action:** `src/app/boss-dashboard/actions.ts` içine `reassignManager` action'ı ekle. Bu action hem Clerk metadata'yı hem de yerel DB'yi güncellemeli.
- [ ] **UI Update:** Boss Dashboard'daki üye listesinde "Düzenle" butonuna tıklandığında şube seçimi yapılabilmesini sağla.

## 🧪 Aşama 4: Doğrulama (Security + Test)
- [ ] **Access Revocation Test:** Silinen yönetici saniyeler içinde sistemden atılıyor mu ve DB'de izi kalıyor mu?
- [ ] **Isolation Test:** Bir yönetici, URL manipülasyonu ile başka şubenin `org_id`'sini kullanarak veri çekebiliyor mu?
