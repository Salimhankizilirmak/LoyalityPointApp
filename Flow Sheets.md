🛡️ Loyalty Point App - Sistem İş Akışı ve Güvenlik Protokolleri (v2.2)
Bu doküman, sistemin "Kapalı Devre, Çok Kiracılı (Multi-tenant) ve Kesin Hiyerarşik Davet" mimarisini tanımlar. Sistemde her rol sadece bir altındaki rolü yönetebilir.
1. Yetki Seviyeleri ve "Kesin" Sorumluluk Zinciri
A. Süper Admin (Platform Sahibi - Novexis Tech)
•	Doğrulama: .env.local -> SUPER_ADMIN_EMAILS.
•	Davet Yetkisi: Sadece Boss (Patron) davet edebilir.
•	Fonksiyon: * Sistemdeki tüm organizasyonları global olarak izler.
•	Organizasyonları Active/Passive olarak işaretler.
•	Boss'un performansını ve toplam şube sayılarını görür.
•	Kısıtlama: Manager, Cashier veya Customer davet edemez.
B. Patron (Boss / Şirket Sahibi)
•	Davet: Süper Admin tarafından davet edilir.
•	Davet Yetkisi: Sadece Manager (Yönetici) davet edebilir.
•	Fonksiyon: * Kendi adına sınırsız Organizasyon (Şube) oluşturabilir.
•	Master Dashboard: Tüm organizasyonlarını yan yana kıyaslar (Kazanç, Müşteri, Verimlilik).
•	Organizasyonlara spesifik Yöneticiler atar veya görevden alır.
•	Kısıtlama: Kasiyer veya Müşteri davet edemez.
C. Yönetici (Manager / Şube Sorumlusu)
•	Davet: Boss tarafından spesifik bir Organizasyon ID'sine atanarak davet edilir.
•	Davet Yetkisi: Sadece kendi bağlı olduğu organizasyona Cashier (Kasiyer) davet edebilir.
•	Fonksiyon: Şubesindeki kasiyerlerin performansını izler ve hatalı puan işlemlerini düzeltir.
•	Kısıtlama: Diğer organizasyonları göremez. Müşteri davet edemez.
D. Kasiyer (Cashier / Operasyon Sorumlusu)
•	Davet: Manager tarafından organizasyon adına davet edilir.
•	Davet Yetkisi: Sadece Customer (Müşteri) davet edebilir.
•	Fonksiyon: Müşteri kaydı yapar, QR okutur, Puan yükler/düşer.
•	Kısıtlama: Yönetici değişse bile Kasiyer organizasyona bağlı kalmaya devam eder.
2. Merkezi Yönlendirme (Routing) ve Dağıtım Mantığı
Tüm girişlerden sonra kullanıcı /dashboard adresine düşer. Middleware aşağıdaki hiyerarşiyi uygular:
	1.	Süper Admin: E-posta listedeyse → /admin (Global Kontrol Paneli).
	2.	Organizasyon Durumu: Kullanıcı bir org_id'ye bağlıysa ve organizations.status === 'passive' ise → /org-disabled (Bilgilendirme sayfası).
	3.	Role: 'boss':
•	Organizasyon yoksa → /create-organization
•	Organizasyon varsa → /boss-dashboard (Tüm şubelerin karşılaştırmalı analizi burada başlar).
	4.	Role: 'manager': Bağlı olduğu tekil şube için → /manager-dashboard.
	5.	Role: 'cashier': Bağlı olduğu tekil şube için → /cashier-dashboard.
	6.	Role: 'customer': Kişisel puan cüzdanı için → /customer-dashboard.
3. Güvenlik Duvarları ve Kritik Kurallar
Senaryo: Organizasyonun Kapatılması (Passive State)
Süper Admin bir organizasyonu pasif yaptığında:
•	O org_id ile eşleşen tüm Manager, Cashier ve Customer'lar sistemden atılır.
•	Yönlendirme /org-disabled sayfasına sabitlenir.
•	Gerekçe: "Organizasyon kapanabilir, kasiyer çıkabilir ama veriler ve erişim güvenliği merkezi kalmalıdır."
Senaryo: Yetki İzolasyonu (Isolation)
•	Bir Manager, URL satırına başka bir şubenin ID'sini yazarak erişmeye çalışırsa; Middleware kullanıcının metadata'sındaki org_id ile path'teki org_id'yi karşılaştırır. Eşleşmiyorsa /unauthorized.
Senaryo: Sadece Davetle Kayıt (Invite-Only)
•	Clerk üzerinde Public Sign-up kesinlikle KAPALIDIR.
•	Kayıt sadece Super Admin -> Boss, Boss -> Manager, Manager -> Cashier, Cashier -> Customer linkleri üzerinden yapılabilir.
4. Teknik Kayıt (Data Persistence) Prensipleri
•	Clerk Metadata: Rol ve org_id bilgisi için tek "Source of Truth" (Doğruluk Kaynağı).
•	Turso DB: İşlem geçmişi, puan bakiyeleri ve organizasyon detayları için kullanılır.
•	Staff Aidiyeti: Kasiyerler tabloda Manager'a değil, doğrudan organization_id'ye bağlıdır. Manager değişse de kasiyerin yetkisi devam eder.
Analiz ve Karşılaştırma Sonucu:
•	Çakışma Giderildi: Boss artık sadece Manager atayabiliyor, operasyonel (Kasiyer/Müşteri) işlere karışmıyor.
•	Eksik Tamamlandı: Boss için "Karşılaştırmalı Analiz" gereksinimi eklendi.
•	Hiyerarşi Netleşti: "Sadece davetli olan girer" kuralı en tepeye yazıldı.