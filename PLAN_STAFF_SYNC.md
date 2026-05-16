# PLAN: Staff Synchronization & Invitation Fix

Bu plan, Boss'un davet ettiği personelleri anında görebilmesini ve davet e-postalarının sorunsuz iletilmesini sağlar.

---

## 📧 Aşama 1: Davetiye Gönderim Onarımı (Invitation Fix)
- [ ] **Clerk Invite Audit:** `memberService.inviteEmployee` metodunda `createInvitation` çağrısını kontrol et. `redirectUrl` ve `publicMetadata` parametrelerinin doğruluğundan emin ol.
- [ ] **Error Handling:** Davetiye oluşturulurken Clerk'ten dönen hataları (örn: "user already invited") Boss'a anlamlı şekilde göster.

## 📊 Aşama 2: Personel Listeleme Senkronizasyonu (Staff List Sync)
- [ ] **Hybrid Listing:** `getOrgMembers` metodunu, hem Clerk'teki aktif üyeleri hem de `invitations` listesindeki bekleyen (pending) kullanıcıları birleştirip döndürecek şekilde güncelle.
- [ ] **Staff Table Persistence:** `inviteEmployee` anında yerel `staff` tablosuna da bir kayıt (status: pending) atılmasını sağla. Böylece veritabanı ve Clerk her zaman senkronize olur.

## 🔄 Aşama 3: Organizasyon Bazlı Filtreleme
- [ ] **Multi-Org Isolation:** Boss'un birden fazla organizasyonu varsa, personellerin sadece seçili `orgId`'ye göre listelendiğinden emin ol.

## 🧪 Aşama 4: Doğrulama
- [ ] **Invite Test:** Yeni bir mail adresiyle davet gönder. Clerk Dashboard'da davetiyenin oluştuğunu ve mailin iletildiğini doğrula.
- [ ] **UI Test:** Davet edilen kişi henüz kabul etmeden Boss dashboard'da "Bekliyor" etiketiyle görünüyor mu?
