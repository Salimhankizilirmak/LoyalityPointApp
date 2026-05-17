GÖREV: Aura Loyalty projesini, Clerk bağımlılığından arındırılmış, KVKK uyumlu, "Merkezi İlişkisel Veritabanı (Turso/Drizzle) Rol ve Audit Ledger" mimarisine refactor edin. Tüm kod tabanını SOLID ve Clean Code prensiplerine uygun olarak, tip güvenliğini (TypeScript) maksimum seviyede tutarak yeniden inşa edin.

---

### 🗄️ AŞAMA 1: VERİTABANI ŞEMASI YENİDEN YAPILANDIRILMASI (`@database-architect`)
`src/db/schema.ts` dosyasını, döngüsel bağımlılıkları (circular dependencies) tamamen engelleyecek ve 3NF (Third Normal Form) kurallarına uyacak şekilde şu Drizzle ORM tablolarıyla sıfırdan oluşturun:

1. users: Tüm aktörlerin (Admin, Boss, Manager, Cashier, Customer) ortak kimlik ve rol köküdür.
   - id: text().primaryKey() (UUID)
   - clerkId: text().unique().notNull()
   - email: text().unique().notNull()
   - role: text({ enum: ["ADMIN", "BOSS", "MANAGER", "CASHIER", "CUSTOMER"] }).notNull()
   - createdAt: integer({ mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`)

2. organizations: Şirket/Holding kök bilgilerini tutar.
   - id: text().primaryKey() (UUID)
   - name: text().notNull()
   - bossId: text().notNull().references(() => users.id, { onDelete: "cascade" })
   - branchLimit: integer().default(1).notNull()
   - isActive: integer({ mode: "boolean" }).default(true).notNull()

3. branches: Şirketlere bağlı fiziki lokasyonlar. İlişki tek yönlüdür; şubede yönetici ID'si tutulmaz!
   - id: text().primaryKey() (UUID)
   - orgId: text().notNull().references(() => organizations.id, { onDelete: "cascade" })
   - name: text().notNull()
   - city: text().notNull()
   - isActive: integer({ mode: "boolean" }).default(true).notNull()

4. staff_profiles: MANAGER ve CASHIER rollerindeki personellerin çalıştığı şubeyi mühürler.
   - id: text().primaryKey() (UUID)
   - userId: text().unique().notNull().references(() => users.id, { onDelete: "cascade" })
   - branchId: text().notNull().references(() => branches.id, { onDelete: "cascade" })

5. customer_profiles: CUSTOMER rolündeki kullanıcıların hangi şirkete bağlı olduğunu ve puan cache'ini tutur.
   - id: text().primaryKey() (UUID)
   - userId: text().unique().notNull().references(() => users.id, { onDelete: "cascade" })
   - orgId: text().notNull().references(() => organizations.id, { onDelete: "cascade" })
   - currentPoints: integer().default(0).notNull() (Hızlı okuma amaçlı veri ambarı/cache alanıdır)

6. points_transactions: Tüm puan hareketlerinin değiştirilemez, silinemez (Append-Only) finansal tescil defteridir (Audit Ledger).
   - id: text().primaryKey() (UUID)
   - customerProfileId: text().notNull().references(() => customer_profiles.id, { onDelete: "restrict" })
   - branchId: text().notNull().references(() => branches.id, { onDelete: "restrict" }) (İşlemin yapıldığı şube)
   - amount: integer().notNull() (Kazanılan puan pozitif, harcanan negatif tutulur)
   - type: text({ enum: ["EARN", "SPEND"] }).notNull()
   - description: text()
   - createdAt: integer({ mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`)

---

AŞAMA 2: SOLID COMPLIANT SERVİS KATMANI REFACTORU (`@backend-specialist`)
- Single Responsibility (SRP): `organization-service.ts`, `staff-service.ts`, `customer-service.ts` ve `points-service.ts` dosyalarını birbirinden tamamen soyutlayın. Servisler arası iletişim sadece interface ve Drizzle ID'leri üzerinden yapılmalıdır.
- Audit Ledger Protokolü: Müşteriye puan ekleme/silme işlemi yapıldığında `points_transactions` tablosuna yeni satır yazılmalı ve eş zamanlı olarak (DB Transaction kullanarak) `customer_profiles.currentPoints` alanı güncellenmelidir. Veri tutarsızlığı (Race Condition) oluşması engellenmelidir.
- Quota Guarding: `createBranch` metodunun en tepesine, organizasyonun yerel DB'deki `branch_limit` değerini kontrol eden ve aşılması durumunda işleme izin vermeyen kodu enjekte edin.

---

AŞAMA 3: KATI VERİ İZOLASYONU VE RBAC (`@security-auditor`)
- IDOR Defending: MANAGER ve CASHIER rollerinin çağıracağı tüm backend servis fonksiyonlarına zorunlu bir `branchId` kontrol filtresi ekleyin. Personel sadece kendi `staff_profiles.branchId` değerine eşit olan verileri manipüle edebilir.
- Super Admin Bypass: Rolü `ADMIN` olan kullanıcı, hiçbir organizasyon veya şube kısıtlamasına takılmadan tüm veritabanı sorgularını bypass yetkisiyle üstten izleyebilmelidir.
- Token Mapping: Clerk Webhook entegrasyonunu veya giriş anındaki senkronizasyonu güncelleyin. Kullanıcı giriş yaptığında yerel veritabanındaki `users.role`, `staff_profiles.branchId` ve `customer_profiles.orgId` değerleri çözümlenerek session'a mühürlenmelidir.

---

AŞAMA 4: INTERFACE VE CLERK UI ARINDIRMASI (`@frontend-specialist`)
- Strict Switcher Gating: Boss panelindeki Header bileşeninde yer alan `<OrganizationSwitcher />` bileşeninin `appearance` ayarlarına müdahale ederek "Create Organization" (Yeni Organizasyon Kur) butonunu ve ikonunu CSS/DOM seviyesinde tamamen gizleyin.
- Corporate Layouts: `/admin`, `/boss-dashboard`, `/manager-dashboard`, `/cashier-dashboard` ve `/customer-dashboard` sayfalarının tamamını yerel veritabanından beslenecek şekilde güncelleyin. Tasarım dilini Indigo Prestige v2 (derin kontrast, cam panel efektleri, sıfır layout shift) standartlarına yükseltin.