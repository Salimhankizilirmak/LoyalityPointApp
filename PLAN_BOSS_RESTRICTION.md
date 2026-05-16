# PLAN: Boss Restriction & UI Fix

Bu plan, Boss yetkilerini kısıtlamayı ve dashboard üzerindeki kritik derleme hatalarını gidermeyi hedefler.

---

## 🚫 Aşama 1: Yetki Kısıtlaması (Backend)
- [ ] **MemberService Rollback:** `inviteEmployee` metodunda Boss'un sadece "manager" davet edebilmesini sağlayan kısıtlamayı geri getir.
- [ ] **Validation:** Manager olmayan davet taleplerinde hata fırlatıldığından emin ol.

## 🛠️ Aşama 2: Dashboard Hata Onarımı (Frontend)
- [ ] **State Restoration:** `page.tsx` içinde silinen `loadingEmps` ve `creatingBranch` state'lerini geri yükle veya kullanıldığı yerlerdeki referansları temizle (Clean-code prensibi gereği kullanılmıyorsa referanslar temizlenmeli, ancak hata verdiğine göre kullanılıyorlar).
- [ ] **Lint Fix:** `Cannot find name` hatalarını gider.

## 🎨 Aşama 3: CSS Düzenlemeleri
- [ ] **Globals.css Audit:** Tailwind v4 `@theme` ve `@custom-variant` uyarılarını kontrol et. VS Code/Lint uyarılarını bastırmak veya doğru sözdizimine geçmek için dosyayı incele.

## 🧪 Aşama 4: Doğrulama
- [ ] **Role Test:** Boss ile Kasiyer davet etmeyi dene (Hata vermeli).
- [ ] **Build Test:** `npm run dev` veya `tsc` ile projede derleme hatası kalmadığını doğrula.
