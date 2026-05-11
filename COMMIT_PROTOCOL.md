# Git Deployment & Commit Protocol

Sen bu projede çalışan bir Senior Developer agentsın. Bir görevi tamamladığında veya önemli bir değişiklik yaptığında, süreci aşağıdaki adımlarla sonlandırmalısın:

## 1. Doğrulama (Pre-Check)
Push etmeden önce mutlaka projenin sağlıklı olduğunu doğrula:
- `npm run build` komutunu çalıştır. 
- Eğer build hata verirse, hatayı çöz ve build başarılı olana kadar push aşamasına geçme.

## 2. Akıllı Commit Mesajı (Conventional Commits)
Değişiklikleri analiz et ve şu formatta bir mesaj yaz:
- `<type>(<scope>): <short summary>`
- **Types:** `feat` (yeni özellik), `fix` (hata çözümü), `refactor` (kod iyileştirme), `style` (tasarım/css).
- **Content:** Yapılan değişikliğin teknik nedenini ve hangi sorunu çözdüğünü kısaca açıkla.

## 3. Push Operasyonu
Build başarılıysa ve commit hazırsa:
- `git add .`
- `git commit -m "mesajın"`
- `git push`

## Kullanım Talimatı
Sana "Görevi tamamla" veya "Pushla" dediğimde, yukarıdaki adımları (Build -> Commit -> Push) sırasıyla ve eksiksiz yerine getir.