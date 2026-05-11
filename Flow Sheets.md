Loyalty Point App - Sistem İş Akışı ve Güvenlik Protokolleri (v2.0)
Bu doküman, sistemin "Kapalı Devre ve Sadece Davetle Çalışan (Invite-Only)" mimarisini ve Next.js Middleware katmanındaki yönlendirme (routing) hiyerarşisini tanımlar.
1. Yetki Seviyeleri ve Rol Tanımları
A. Süper Admin (Sistem Sahibi)
•	Doğrulama: Veritabanından bağımsız olarak .env.local içerisindeki SUPER_ADMIN_EMAILS listesiyle kontrol edilir.
•	Alan: Sadece /admin dizininde tam yetkilidir.
•	Özel Yetki: Organizasyonları dondurabilir (Suspend), yeni organizasyon (tenant) yaratabilir.
B. Patron (Boss / Tenant Owner)
•	Davet: Süper Admin tarafından davet edilir.
•	Alan: /boss-dashboard.
•	Sorumluluk: Organizasyonun kurulumu, şubelerin oluşturulması ve Yönetici/Kasiyer davetlerinin yönetimi.
C. Yönetici & Kasiyer (Staff)
•	Yönetici: Şube bazlı yetki. /manager-dashboard.
•	Kasiyer: İşlem bazlı yetki. /cashier-dashboard.
D. Müşteri (Customer)
•	Davet: Kasiyer veya Yönetici tarafından (e-posta/tel ile) davet edilir.
•	Alan: /customer-dashboard.
•	Fonksiyon: Puan takibi ve QR kod gösterimi.
2. Merkezi Yönlendirme Mantığı (The Master Redirector)
Tüm giriş işlemleri sonrası kullanıcılar /dashboard (dağıtıcı kök) adresine düşer. Middleware ve bu sayfa aşağıdaki Öncelik Sırasına göre kullanıcıyı fırlatır:
	1.	Süper Admin Kontrolü: E-posta SUPER_ADMIN_EMAILS içindeyse → DERHAL /admin.
	2.	Organizasyon Durum Kontrolü: Kullanıcının bağlı olduğu organizasyon "Passive" ise → DERHAL /org-disabled.
	3.	Rol Bazlı Yönlendirme (Metadata):
•	role: 'boss' ve Organizasyon kurulmamışsa → /create-organization
•	role: 'boss' ve Organizasyon aktifse → /boss-dashboard
•	role: 'manager' → /manager-dashboard
•	role: 'cashier' → /cashier-dashboard
•	role: 'customer' → /customer-dashboard
	4.	Tanımsız/Davetsiz Kullanıcı: Yukarıdaki şartların hiçbiri sağlanmıyorsa → /unauthorized.
3. Kritik Senaryolar ve Güvenlik Duvarları
Senaryo 1: Davetsiz Giriş Teşebbüsü
•	Politika: Clerk üzerinde "Public Sign-Up" kapalıdır.
•	Sonuç: Sadece geçerli bir invitation linkine sahip olanlar hesap oluşturabilir. Rastgele bir kullanıcı kayıt ekranına ulaşsa bile "Kayıtlar kapalıdır" uyarısı alır.
Senaryo 2: Rol İhlali (Yetki Aşımı)
•	Durum: Bir Kasiyer, URL satırına elle /boss-dashboard yazarsa.
•	Koruma: Middleware ve Sayfa Seviyesi Koruma (Layout level) devreye girer. Kullanıcının metadata'sındaki rol, erişmeye çalıştığı path ile eşleşmiyorsa kullanıcı /unauthorized sayfasına geri itilir.
Senaryo 3: Pasif Şirket Erişimi
•	Durum: Süper Admin bir firmayı (Örn: LC Waikiki) askıya alırsa.
•	Koruma: Veritabanındaki organizations.status değeri "inactive" olduğu an, bu organizasyon ID'sine bağlı tüm alt roller (Patron dahil) sistemden dışarı atılır ve sadece /org-disabled sayfasını görebilirler.
Senaryo 4: Müşteri İlk Giriş (Onboarding)
•	Akış: Kasiyer müşteriyi davet eder → Müşteri linke tıklar ve kayıt olur → Sistem onu role: 'customer' olarak tanır → İlk girişte /customer-dashboard'a yönlendirilir ve "Hoş geldin" hediyesi puanı veritabanına işlenir.
4. Kırmızı Çizgiler (Hard Rules)
•	Middleware Is King: Hiçbir sayfa, kullanıcının rolünü kontrol etmeden render edilmeyecektir.
•	No Clerk Dashboard: Kullanıcılar asla Clerk'in kendi profil yönetimine gidemez. Tüm "Çıkış Yap" veya "Hesabım" butonları uygulama içindeki / ana sayfasına veya /profile sayfasına bağlıdır.
•	Strict Metadata: Veritabanındaki (Turso) kullanıcı rolleri ile Clerk Metadata rolleri her zaman senkronize olmalıdır. Birincil kaynak (Source of Truth) Clerk Metadata'dır.
•	Env Security: SUPER_ADMIN_EMAILS asla istemci tarafına (client-side) sızdırılmamalı, sadece server-side kontrollerde kullanılmalıdır.