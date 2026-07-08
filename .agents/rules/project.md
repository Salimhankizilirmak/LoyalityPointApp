Önce .agents/rules/auto-routing.md dosyasını oku ve uygula.

# Okut Kazan — Proje Kuralları ve Mimari Standartlar

> Bu dosya projenin tek kaynak of truth'udur. Ajan her görev öncesi bu dosyayı okur.
> Hiçbir kural "şimdilik" geçici değildir. Tüm kurallar production standardındadır.

---

## 0. İLETİŞİM VE ÇALIŞMA PRENSİBİ

**Kritik Kural (MANDATORY):** Projedeki tüm iletişim, `/status` raporları, hata analizleri, planlamalar ve agent'ın kullanıcıyla olan tüm konuşmaları **tamamen Türkçe** yapılacaktır. İngilizce yanıtlar kesinlikle kabul edilmeyecektir. Kod içi değişkenler ve fonksiyon isimleri standartlara uygun olarak İngilizce kalabilir.

Her görev başlamadan önce ajan şu soruları yanıtlar:

1. Bu değişiklik hangi dosyaları etkiler?
2. Bu dosyalardan herhangi biri FROZEN listesinde mi?
3. Bu değişiklik Clerk, Svix, Nodemailer gibi harici bir sisteme dokunan bir dosyayı etkiliyor mu?
4. SOLID prensiplerine uyuyor mu?

Yanıt alınmadan kod yazılmaz.

Her plan sonrası: `python3 .agent/scripts/checklist.py .`
Her görev sonrası: `npx tsc --noEmit`

İkisi de hatasız geçmeden görev tamamlanmış sayılmaz.

---

## 1. PROJE KİMLİĞİ

**Okut Kazan**, Türk işletmelerine yönelik çok kiracılı (multi-tenant) B2B SaaS sadakat ekosistemidir.

- **Framework:** Next.js 15+ App Router
- **Auth:** Clerk Enterprise (JWT claims tabanlı RBAC)
- **Veritabanı:** Turso DB (Edge SQLite / LibSQL) + Drizzle ORM
- **Webhook:** Svix (Clerk event doğrulama)
- **Mail:** Nodemailer (SMTP)
- **UI:** Tailwind CSS + Framer Motion (glassmorphic tasarım)
- **Deploy:** Vercel (GitHub CI/CD)
- **Dil:** Tüm kullanıcıya dönük metin Türkçe, `tr-TR` number formatting

---

## 2. ROL MATRİSİ VE YETKİ SINIRLARI

| Rol | URL | Temel Yetki |
|-----|-----|-------------|
| Super Admin | `/admin` | Tüm organizasyonları, kotaları, logları yönetir |
| Boss | `/boss-dashboard` | Organizasyon kurar, şube açar, üst personel atar |
| Manager | `/manager-dashboard` | Sadece kendi şubesini yönetir |
| Cashier | `/cashier-dashboard` | QR okur, puan ekler/harcar |
| Customer | `/customer-dashboard` | Puan cüzdanı, QR üretir |

**Kritik Kural:** Bir rol kendi yetki sınırının dışına çıkamaz. Manager başka şubeleri göremez. Cashier müşteri profilini değiştiremez. Bu izolasyon `resolvedBranchId` ve `resolvedOrgId` denetimleriyle sağlanır — bu denetimler asla kaldırılamaz.

---

## 3. FROZEN FILES — DOKUNULMAZ DOSYALAR

Aşağıdaki dosyalar harici sistemlere bağlıdır. Değişiklik yapılmadan önce **mimari onay** gerekir. Ajan bu dosyalara asla doğrudan müdahale etmez, sadece okuyabilir.

| Dosya | Bağlı Sistem | Neden Kritik |
|-------|-------------|--------------|
| `src/proxy.ts` | Clerk Middleware | Tüm HTTP trafiğinin güvenlik kalkanı |
| `src/app/api/webhooks/clerk/route.ts` | Clerk + Svix | Kullanıcı/org event senkronizasyonu |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Clerk | Clerk'in beklediği URL pattern |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | Clerk | Clerk'in beklediği URL pattern |
| `src/lib/services/email-service.ts` | Nodemailer SMTP | Kurumsal mail gönderimi |
| `src/scripts/clerk-invitations-manager.js` | Clerk Backend SDK | Davetiye yönetim scripti |

**Kural:** Bu dosyalara dokunan her prompt önce "Bu frozen dosyayı neden değiştirmem gerekiyor?" sorusunu yanıtlamalı ve alternatif yaklaşım olmadığını kanıtlamalıdır.

---

## 4. ENVIRONMENT VARIABLES — ZORUNLU KONTROL

Servis dosyalarında environment variable kullanımı şu pattern'e uymak zorundadır:

```typescript
// ✅ DOĞRU
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
if (!appUrl) {
  throw new Error("NEXT_PUBLIC_APP_URL environment variable is not set");
}

// ❌ YANLIŞ — asla yapılmaz
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
```

**Zorunlu environment variable'lar:**
- `NEXT_PUBLIC_APP_URL` — canlı domain, fallback YASAKTIR
- `CLERK_SECRET_KEY` — Clerk backend erişimi
- `CLERK_WEBHOOK_SECRET` — Svix doğrulama
- `DATABASE_URL` — Turso bağlantısı

Herhangi biri eksikse uygulama graceful hata fırlatır, sessizce localhost'a düşmez.

---

## 5. SOLID PRENSİPLERİ — KATI KURALLAR

### 5.1 Single Responsibility (SRP)

**page.tsx dosyaları için 150 satır sınırı kesindir.**

Sayfa bileşeni sadece şunları yapabilir:
- İlgili custom hook'u çağırmak
- Layout bileşenlerini render etmek
- Modal/section bileşenlerini prop ile beslemek

```typescript
// ✅ DOĞRU — page.tsx orchestrator rolünde
export default function BossDashboardPage() {
  const { state, actions } = useBossDashboard();
  return (
    <BossDashboardLayout>
      <BossDashboardModals state={state} actions={actions} />
      <BossDashboardContent state={state} actions={actions} />
    </BossDashboardLayout>
  );
}

// ❌ YANLIŞ — sayfa içinde iş mantığı
export default function BossDashboardPage() {
  const [data, setData] = useState([]);
  useEffect(() => { fetch("/api/...").then(...) }, []);
  // ... 200 satır devam
}
```

### 5.2 State ve İş Mantığı Yalıtımı

- `useState`, `useCallback`, `useEffect` sayfa dosyasında YASAKTIR
- Tüm state ve iş mantığı `hooks/` klasöründeki custom hook'a taşınır
- Hook adı `use[DashboardAdı]Dashboard.ts` formatını takip eder

```
src/components/features/boss-dashboard/hooks/useBossDashboard.ts       ✅
src/components/features/manager-dashboard/hooks/useManagerDashboard.ts  ✅
src/app/(boss)/boss-dashboard/page.tsx içinde useState                  ❌
```

### 5.3 Modüler Bileşenler

Sayfa dosyası içine inline bileşen yazılmaz. Her UI parçası bağımsız dosyadadır:

```
src/components/features/[feature-name]/
  hooks/          → iş mantığı ve state
  sections/       → büyük içerik blokları (Feature/Container)
  ui/             → küçük UI parçaları (Presentational)
  modals/         → modal ve overlay bileşenleri
```

### 5.4 Yetkilendirme (Guard) Katmanı

Sayfa içinde `useEffect` ile rol kontrolü ve router yönlendirmesi YASAKTIR.

```typescript
// ❌ YANLIŞ
useEffect(() => {
  if (user.role !== "BOSS") router.push("/");
}, [user]);

// ✅ DOĞRU — yetkilendirme layout.tsx içinde server-side yapılır
// src/app/(boss)/boss-dashboard/layout.tsx
const dbUser = await checkLayoutGuard();
```

### 5.5 Open/Closed Prensibi

Mevcut servis sınıfları değiştirilmeden genişletilir. Yeni özellik için `base-service.ts`'i değiştirmek yerine yeni metod eklenir veya mevcut servisten extend edilir.

### 5.6 Dependency Inversion

Sayfa bileşenleri doğrudan `db` veya Clerk client'a erişemez. Erişim hiyerarşisi:

```
page.tsx → custom hook → server action → service → db/clerk
```

Araya girmek yasaktır. Sayfa `db.select()` çağıramaz.

---

## 6. KLASÖR YAPISI VE DOSYA YERLEŞİM KURALLARI

```
src/
├── app/                          → Sadece routing, layout, server actions
│   ├── (boss)/boss-dashboard/    → Boss route grubu
│   ├── (manager)/manager-dashboard/
│   ├── (cashier)/cashier-dashboard/
│   ├── (customer)/customer-dashboard/
│   ├── admin/                    → Super Admin
│   ├── api/                      → API routes (webhooks, terminal, auth)
│   ├── sign-in/[[...sign-in]]/   → FROZEN — Clerk
│   └── sign-up/[[...sign-up]]/   → FROZEN — Clerk
│
├── components/
│   ├── ui/                       → Saf görsel, iş mantığı içermez
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── features/
│   │   └── [feature-name]/       → Her rol için ayrı klasör
│   │       ├── hooks/            → Custom hook'lar
│   │       ├── sections/         → Feature/Container bileşenler
│   │       ├── ui/               → Presentational bileşenler
│   │       └── modals/           → Modal ve overlay'ler
│   ├── dashboard/                → Ortak dashboard bileşenleri
│   │   ├── SignOutOverlay.tsx
│   │   └── DashboardLoadingScreen.tsx
│   └── providers/                → Context provider'lar
│
├── lib/
│   ├── services/                 → Backend servis sınıfları
│   │   ├── base-service.ts       → Temel servis (extend edilir)
│   │   ├── admin-service.ts
│   │   ├── staff-service.ts
│   │   ├── customer-service.ts
│   │   ├── organization-service.ts
│   │   ├── loyalty-service.ts
│   │   ├── points-service.ts
│   │   ├── analytics-service.ts
│   │   ├── email-service.ts      → FROZEN — Nodemailer
│   │   ├── manager-service.ts
│   │   └── terminal-handshake-service.ts
│   ├── auth-utils.ts             → Rol bazlı yönlendirme
│   ├── branch-context.ts         → Şube bağlamı çözümleme
│   ├── cache-registry.ts         → In-memory cache
│   ├── layout-guard.ts           → Server-side auth guard
│   ├── roles.ts                  → Rol sabitleri
│   ├── terminal-crypto.ts        → POS kriptografi
│   └── utils.ts                  → clsx + tailwind-merge
│
├── db/
│   └── schema.ts                 → Drizzle ORM şeması
│
└── scripts/                      → Yönetim scriptleri
```

**Yeni dosya eklerken kontrol:**

| Ne ekliyorum? | Nereye gider? |
|---------------|---------------|
| Saf UI bileşeni (buton, input, kart) | `components/ui/` |
| Rol'e özel büyük içerik bloğu | `components/features/[rol]/sections/` |
| Rol'e özel küçük UI parçası | `components/features/[rol]/ui/` |
| Rol'e özel modal/overlay | `components/features/[rol]/modals/` |
| State + iş mantığı | `components/features/[rol]/hooks/` |
| DB/Clerk işlemi | `lib/services/[ilgili]-service.ts` |
| API endpoint | `app/api/[kategori]/route.ts` |
| Ortak yardımcı fonksiyon | `lib/utils.ts` veya yeni `lib/[ad].ts` |

---

## 7. DAVET VE AUTH AKIŞI — KRİTİK KURALLAR

### 7.1 Davet URL'leri

Tüm davet URL'leri `NEXT_PUBLIC_APP_URL` environment variable'ından üretilir. Hardcode domain veya localhost YASAKTIR.

```typescript
// admin-service.ts ve staff-service.ts içinde zorunlu pattern
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL environment variable is not set");
```

### 7.2 Rol Metadata Sözleşmesi

Clerk `publicMetadata` ile yerel DB arasında büyük/küçük harf sözleşmesi:

| Konum | Format | Örnek |
|-------|--------|-------|
| Yerel DB `role` kolonu | BÜYÜK HARF | `MANAGER`, `BOSS`, `CASHIER` |
| Clerk `publicMetadata.role` | küçük harf | `manager`, `boss`, `cashier` |

Bu dönüşüm her zaman servis katmanında yapılır, sayfa veya hook'ta yapılmaz.

### 7.3 Self-Healing Mekanizması

`layout-guard.ts` içindeki JIT senkronizasyon dokunulmaz bir mekanizmadır. Webhook gecikmelerini telafi eder. Bu dosyada yapılacak her değişiklik tüm davet akışını etkileyebilir — FROZEN listesinde değildir ama en yüksek dikkat gerektiren dosyalardan biridir.

### 7.4 SignOut Akışı

Çıkış işlemi şu sırayla gerçekleşir ve bu sıra değiştirilemez:

```typescript
onCountdownComplete={async () => {
  router.push("/");  // 1. Önce Next.js router yönlendirir
  await signOut();   // 2. Sonra Clerk oturumu kapatır
}}
```

`signOut({ redirectUrl: "..." })` kullanımı YASAKTIR — layout guard çakışması yaratır.

### 7.5 SignOutOverlay Mimarisi

Her dashboard'da SignOutOverlay tek bir yerden yönetilir — `[Rol]DashboardModals.tsx` içinden. Layout katmanına SignOutOverlay eklenmez.

```
✅ BossDashboardModals.tsx      → showSignOutOverlay yönetir
✅ ManagerDashboardModals.tsx   → showSignOutOverlay yönetir
✅ CustomerDashboardModals.tsx  → showSignOutOverlay yönetir
❌ layout.tsx içinde SignOutOverlay   → YASAK
```

---

## 8. B2B SaaS ZORUNLU KONTROLLER

Her yeni özellik eklenirken şu sorular yanıtlanmalıdır:

### 8.1 Multi-Tenant İzolasyonu
- Bu özellik bir organizasyonun verisini başka organizasyona sızdırır mı?
- Tüm DB sorguları `orgId` ile filtreleniyor mu?
- `resolvedOrgId` ve `resolvedBranchId` kullanılıyor mu?

### 8.2 RBAC Kontrolü
- Bu endpoint'e yetkisiz bir rol erişebilir mi?
- Server action içinde rol kontrolü yapılıyor mu?
- Sadece `layout-guard.ts` değil, action seviyesinde de kontrol var mı?

### 8.3 Davetiye ve Kota
- Clerk ücretsiz katman limitleri aşılıyor mu?
- Nodemailer fallback mekanizması tetiklenebilir mi?
- Davetiye kabul/red durumları yerel DB'de güncelleniyor mu?

### 8.4 Webhook Güvenilirliği
- Clerk webhook'u gecikirse sistem çöküyor mu?
- `layout-guard.ts` JIT mekanizması bu senaryoyu kapsıyor mu?
- Davetiye durumu `PENDING → ACCEPTED` geçişi her iki sistemde senkron mu?

### 8.5 Kritik Risk Noktaları (⚠️ Drift Senaryoları)

| Senaryo | Risk | Önlem |
|---------|------|-------|
| Clerk org silindi, webhook düşmedi | Yerel DB'de org hâlâ aktif | layout-guard'da org aktiflik kontrolü |
| Personel daveti kabul edildi, şube silindi | FK hatası | Davet kabul öncesi şube varlık kontrolü |
| Telefon format farkı (`+90` vs `90`) | Mükerrer müşteri kaydı | syncCustomerData'da normalize et |
| Super Admin daveti Clerk'te askıda, DB'de silindi | Mükerrer davet hatası | Davet öncesi Clerk'te aktif davet kontrolü |

### 8.6 Kasiyer Counter Mekanizması

`staff-service.ts` → `getOrgMembers` metodu, her kasiyer için şu counter verileri döndürür:

| Alan | Kaynak | Hesaplama |
|------|--------|-----------|
| `txCount` | `loyaltyTransactions` | `COUNT(*)` — `cashierId` eşleşmesi |
| `pointsEarned` | `loyaltyTransactions` | `SUM(pointsAmount)` — `type = 'EARN'` |
| `pointsSpent` | `loyaltyTransactions` | `SUM(pointsAmount)` — `type = 'BURN'` |
| `dailyAmount` | `loyaltyTransactions` | `SUM(amountSpent)` — `createdAt >= today` |
| `invitedCustomerCount` | `invitations` | `COUNT(*)` — `invitedBy = cashierId AND role = 'CUSTOMER'` |
| `acceptedAt` | `invitations` | `createdAt` — `email eşleşmesi AND status = 'ACCEPTED'` |

**Önemli:** `invitedCustomerCount` ve `acceptedAt` şu anda **Live Count/Query** ile hesaplanmaktadır. İleride performans ihtiyacına göre `staffProfiles` tablosuna dedicated counter kolonları eklenebilir.

### 8.7 Açık TODO'lar

- **Telefon→Username Otomasyonu Sonrası UX:** 
- **Counter Migration:** `invitedCustomerCount` ileride `staffProfiles` tablosuna kolon olarak eklenip upsert mantığıyla güncellenecek.

---

## 9. KOD KALİTESİ STANDARTLARI

### 9.1 DRY (Don't Repeat Yourself)

Tespit edilen tekrar eden kod alanları — bunlar refactor edilmeli, kopyalanmamalı:

- Telefon formatlama ve ad/soyad doğrulama: `onboarding/page.tsx` ile `ProfileSettingsForm.tsx` arasında — ortak util'e taşı
- Glassmorphic arka plan efekti: `SignOutOverlay.tsx` ile `DashboardLoadingScreen.tsx` arasında — ortak CSS class veya bileşen

### 9.2 TypeScript

- `any` tipi YASAKTIR
- Her servis metodunun dönüş tipi explicit tanımlanır
- Clerk `publicMetadata` tipleri `src/lib/roles.ts` içinde merkezi tanımlanır

### 9.3 Hata Yönetimi

Servis metodları sessizce hata yutmaz:

```typescript
// ❌ YANLIŞ
try {
  await clerk.invitations.create(...);
} catch {
  return null;
}

// ✅ DOĞRU — rollback yapılır, hata fırlatılır
try {
  await clerk.invitations.create(...);
} catch (error) {
  await rollbackClerkOrg(clerkOrgId);
  throw new Error(`Davetiye oluşturulamadı: ${error}`);
}
```

### 9.4 Server Action Güvenliği

Her server action başında:
1. Oturum kontrolü (`auth()` veya `checkLayoutGuard()`)
2. Rol kontrolü (`dbUser.role === "BOSS"` vb.)
3. Organizasyon sahipliği kontrolü (`orgId` eşleşmesi)

Bu üç kontrol eksik olan hiçbir action production'a çıkmaz.

### 9.5 Veritabanı ve Performans (SQLite İndeksleme)

- SQLite'ta indekslerin verimli çalışması (B-Tree) için eşitlik koşullarının sol tarafı (LHS) daima yalın bırakılmalıdır.
- `like('%' || kolon)` şeklinde cümlenin başına `%` (wildcard) eklenmesi, indeksleri bozar ve Full Table Scan'e yol açar. Bu tür kullanımlar **KESİNLİKLE YASAKTIR**.
- Eşleştirme işlemlerinde, Drizzle ORM tarafında sağ taraf (RHS) manipüle edilmeli, sol taraftaki kolon fonksiyon içine alınmamalıdır. (Örn: `eq(customers.phoneNumber, sql\`'0' || substr(${invitations.phoneNumber}, -10)\`)`)

---

## 10. ARAYÜZ STANDARTLARI (Taste Skill Uyumu)

Proje glassmorphic premium tasarım dilini korur. Yeni UI yazılırken:

- Generic/boilerplate görünen bileşenler kabul edilmez
- Framer Motion animasyonları mevcut bileşenlerle tutarlı olmalı
- Türkçe copy: tüm buton, label, hata mesajı ve bildirimler Türkçe
- `tr-TR` number formatting: para birimi ve sayısal değerler
- Renk paleti ve cam efektleri mevcut `GlassPanel` ve `GlassInput` bileşenleriyle tutarlı
- **Tema Bütünlüğü:** Tüm dashboardlar (Kasiyer Paneli vb.), ana Landing sayfasındaki karanlık, modern, neon/indigo temasını yansıtmalı (örn. `bg-neutral-950` arkaplan, transparan sidebar, `okka-logo.png` kullanımı). İşlemler ve müşteriler gibi farklı veri türleri aynı sayfada tab ile sıkıştırılmak yerine, ayrı rotalara ayrılarak `Sidebar` üzerinden yönetilmeli.

### 10.1 Glassmorphic Kart Standardı

Tüm kart tabanlı bileşenler aşağıdaki referans sınıfları kullanır:

```
Kart:     bg-[#0a0a0f]/40 backdrop-blur-xl border border-white/5 rounded-3xl
Hover:    hover:border-indigo-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]
Glow:     bg-cyan-500/10 blur-[60px] (absolute positioned, -z-10)
Avatar:   bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/20
Stat Box: bg-neutral-900/60 rounded-xl p-3 border border-white/5
```

**Uygulanan bileşenler:** `CustomerManagement.tsx`

### 10.2 B2B Kurumsal Kart Standardı

Dashboards içinde profesyonel ve resmiiyet gerektiren kısımlarda (örneğin Personel/Ekip Yönetimi) neon/glow kullanımı yasaktır. `/ui-ux-pro-max` yönergeleri uyarınca şu yapı benimsenmiştir:
- Arka plan: `bg-[#0F172A]`
- Çerçeve: `border-slate-800`
- Metinler: `text-slate-300`, `text-slate-400`
- Terminoloji: B2B kurumsal terminoloji (Örn: "Harcattırdığı" yerine "Harcama Hacmi")
- Resim Fallback: Kırık `<img>` (<img src="??"> gibi) render hatalarını önlemek için url formatı kontrol edilir (`emp.avatar.startsWith("http")`). Hata varsa, isim ve soy ismin baş harflerinden oluşan Slate tonlu bir logo (`<div className="font-bold bg-slate-800 text-slate-300 ...">`) render edilir.

**Uygulanan bileşenler:** `EmployeeManagement.tsx`

### 10.2 Müşteri Sayfası Düzeni

- **Yapı:** Üstte telefon ile arama çubuğu, altta **2×2 Grid** kart düzeni (`grid-cols-1 md:grid-cols-2`)
- **Kart sayısı:** Arama yoksa `filteredCustomers.slice(0, 4)` — en son işlem yapan 4 müşteri
- **Scroll:** Yok. Responsive yapıda mobilde 1 kolon, tablet/desktop'ta 2 kolon.
- **Arama sonuçları:** Telefon numarası ile filtrelenmiş tüm sonuçlar aynı kart formatında gösterilir.

### 10.3 Kampanyalar Sayfası Düzeni

- **Yapı:** Split View — üstte KPI Ribbon (4 mini istatistik kartı), altta iki sütunlu grid
- **Sol sütun:** Şube Kazanım Oranı ayar kartı + Yeni Kampanya formu
- **Sağ sütun:** Aktif Kampanya kartı + Geçmiş Kampanyalar listesi
- **Genişlik:** `max-w-7xl` (eskiden `max-w-4xl`)
- **Renk paleti:** Indigo/Cyan neon gradient — Landing temasıyla tutarlı

---

## 11. VERCEL DEPLOYMENT KURALLARI

- Her push öncesi `npx tsc --noEmit` yerel olarak çalıştırılır
- Environment variable'lar Vercel dashboard'dan yönetilir, `.env` dosyası commit edilmez
- `NEXT_PUBLIC_APP_URL` production domain'e set edilmiş olmalıdır — kontrol edilmeden deploy yapılmaz
- Preview deployment'larda davet URL'leri production'a değil preview URL'sine point eder — bu beklenen davranıştır

---

## 12. YASAK LİSTESİ — ASLA YAPILMAYACAKLAR

```
❌ like('%' || kolon) gibi indeksleri bozan Full Table Scan sorguları
❌ page.tsx içinde useState / useEffect
❌ page.tsx 150 satırı geçemez
❌ Sayfa içinde db.select() çağrısı
❌ process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
❌ signOut({ redirectUrl: "..." }) — layout guard çakışması
❌ Layout katmanında SignOutOverlay render etmek
❌ useEffect ile istemci taraflı rol koruması
❌ Servis metodunda sessiz hata yutmak (boş catch bloğu)
❌ TypeScript any tipi
❌ Frozen dosyalara onaysız müdahale
❌ Türkçe yerine İngilizce kullanıcı metni
❌ Hardcode domain veya IP adresi
```

---

## 13. YENİ ÖZELLİK EKLEME KONTROL LİSTESİ

Yeni bir özellik yazılmadan önce ajan şunu tamamlar:

```
[ ] Hangi rol(ler) bu özelliği kullanacak?
[ ] Hangi servis dosyasına metod eklenecek?
[ ] Hangi custom hook değiştirilecek veya yeni hook oluşturulacak?
[ ] page.tsx 150 satır sınırını aşmayacak mı?
[ ] FROZEN dosyalara dokunulacak mı? (Evet ise dur, onay al)
[ ] Multi-tenant izolasyonu korunuyor mu?
[ ] RBAC kontrolü server action'da yapılıyor mu?
[ ] Environment variable doğru kullanılıyor mu?
[ ] npx tsc --noEmit geçiyor mu?
[ ] python3 .agent/scripts/checklist.py . geçiyor mu?
```

Hepsi ✅ olmadan PR açılmaz.


## 14. GİT DIFF VE KODSAL DOĞRULAMA SÖZLEŞMESİ (CRITICAL)
Ajan, her başarılı görev ve doğrulama adımından sonra üreteceği 'walkthrough.md' veya özet raporlarında, sadece jenerik metinler ve checklist başarı yazıları paylaşamaz. Değiştirilen, silinen veya eklenen tüm kod bloklarını, projenin kaynak dosyalarındaki tam satırlarıyla birlikte 'Önceki Hali (Before)' ve 'Değiştirilmiş Hali (After)' şeklinde kod blokları (markdown code blocks) halinde açıkça listelemek zorundadır. Kodsal diff sunulmadan görev tamamlanmış sayılmaz.
