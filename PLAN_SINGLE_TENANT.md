# Aura Loyalty - Single Tenant, Multi-Branch Architecture Plan

## Amaç
Aura Loyalty uygulamasını kurumsal "Tek Şirket, Çoklu Şube" (Single Tenant, Multi-Branch) mimarisine taşımak. Clerk üzerinde her şube için ayrı bir organizasyon açılması anti-pattern'ını ortadan kaldırarak; güvenliği Clerk'e, şube hiyerarşisini yerel veritabanına (Turso) devretmek.

## Aşama 1: Veritabanı Şeması ve İlişkileri (`database-architect`)
*   **`organizations` Tablosu Güncellemesi:**
    *   Bu tablo Clerk'in ürettiği tekil `orgId`'yi (örn. `org_lcwaikiki`) temsil etmeye devam edecek, ancak bu artık bir şube değil, ana şirket olacak.
*   **Yeni `branches` Tablosu:**
    *   Sütunlar: `id` (CUID/UUID), `org_id` (Foreign Key -> `organizations.id`), `name`, `city`, `isActive`, `createdAt` vb.
    *   Her şube bağımsız bir satır olarak kaydedilecek.
*   **`staff` Tablosu Güncellemesi:**
    *   Mevcut `orgId` ve `branchName` sütunları yerine/yanına `branchId` (Foreign Key -> `branches.id`) sütunu ZORUNLU hale getirilecek.
    *   Manager ve Cashier rolleri `branchId`'ye doğrudan bağlanacak.
*   **`points_transactions` Tablosu Güncellemesi:**
    *   İşlemlerin hangi şubede yapıldığını izlemek için `orgId` yerine veya yanına `branchId` eklenecek.

## Aşama 2: Clerk Metadata ve Personel Gating (`security-auditor`)
*   **Davet ve Kayıt Sistemi:**
    *   Boss SADECE yönetici (Manager) davet edebilecek. Kasiyer davet etme yetkisi kaldırılacak ve UI'dan kasiyer seçimi çıkarılacak. Davet ana şirket organizasyonuna (Clerk Org) yapılacak.
    *   Kullanıcının kayıt işlemi (onboarding) sırasında veya davet objesinde `publicMetadata` güncellenerek: `{ "role": "manager", "org_id": "org_xxx", "branch_id": "turso_branch_id" }` formatında veri mühürlenecek.
*   **Veri İzolasyon Sınırı (Row-Level Security):**
    *   Tüm servis katmanı (puan ekleme, harcama, şube detayları) sorgularında IDOR koruması olarak `auth().sessionClaims.publicMetadata.branch_id` ile `where` koşulu zorunlu kılınacak.

## Aşama 3: Server Actions & Business Logic (`backend-specialist`)
*   **`createBranch` Action Refactor:**
    *   Clerk API tetiklenerek organizasyon AÇILMAYACAK.
    *   Sadece yerel Turso DB'deki `branches` tablosuna yeni kayıt atılacak.
*   **`getDashboardData` Logic Ayrışması:**
    *   **Boss:** `Clerk orgId`'sine bağlı tüm `branches` tablosundaki şubelerin toplam aggregate (toplam işlem/puan/müşteri) verilerini çekecek.
    *   **Manager/Cashier:** Sadece metadata'daki `branch_id`'ye ait spesifik verileri görecek. Diğer şubelerin verilerine erişim kesinlikle reddeilecek.

## Aşama 4: Frontend UI ve Indigo Prestige V2 (`frontend-specialist`)
*   **Header Dropdown (OrganizationSwitcher):**
    *   Clerk'in `OrganizationSwitcher` bileşeni SADECE ana şirketler (Tenants) arasında geçiş için kullanılacak (Boss birden fazla şirkete sahipse).
*   **Branch Selector (Şube Seçici):**
    *   Boss panelinde, şubeler arasında gezmek için `branches` tablosundan beslenen özel tasarım bir `.glass-panel` şube seçici dropdown yapılacak.
*   **Tema Uyumluluğu:**
    *   Yeni eklenecek tüm şube seçim ve personel panelleri WCAG kontrast standartlarına uygun olarak Light/Dark mod senkronizasyonunu destekleyecek.

## Aşama 5: Sistem Güvenlik Denetimi (`debugger` / `security-auditor`)
*   **IDOR Testi:** URL'deki `?branchId=` parametresinin manuel olarak değiştirilmesi durumunda yetkisiz şubeye girişin Server-Side doğrulama ile 401/403 hatasıyla engellendiği test edilecek.
*   **Eski Veri Migrasyonu (Varsa):** Varolan Clerk organizasyonlarının ana şirket olarak ayarlanması, sahte şube organizasyonlarının silinmesi ve DB temizliği.
