# Görev: QR ile Müşteri Kaydı + Kasiyer Onayı + Yönetici Canlı İşlem Akışı (v2)

**Bu dosya `qr-musteri-kaydi-prompt.md` dosyasının YERİNE geçer.** O dosyayı
kullanmayı bırak, `customers` tablosuna doğrudan `status` eklemek yerine ayrı
bir `customer_registration_requests` tablosu kullanıyoruz — sebep: `customers`
tablosunu her zaman "gerçek, onaylı müşteri" anlamına gelecek şekilde temiz
tutmak, ileride yazılacak/var olan hiçbir sorgunun (kampanya, listeleme,
istatistik) `status` filtresi unutma riskiyle karşılaşmaması için.

Ayrıca bu görev, yöneticinin genel bakış sayfasındaki "Canlı İşlem Akışı"
özelliğini de kapsıyor — bu akış join ile DEĞİL, ayrı bir `activity_logs`
tablosundan okunacak (sebep: performans + ileride kaynak veri silinse/
anonimleştirilse bile geçmiş logun bozulmaması).

9 adıma bölünmüştür. Her adım sonrası doğrula, rapor ver, onay bekle.

---

## Adım 1 — Şema Değişiklikleri

### 1a. `organizations`
```typescript
registrationCode: text("registration_code").unique()
```

### 1b. Yeni tablo — `customer_registration_requests`
```typescript
export const customerRegistrationRequests = sqliteTable("customer_registration_requests", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  clerkUserId: text("clerk_user_id"),
  status: text("status").notNull().default("PENDING_APPROVAL"), // PENDING_APPROVAL | APPROVED | REJECTED
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  approvedByCashierId: text("approved_by_cashier_id"),
  decidedAt: integer("decided_at", { mode: "timestamp" }), // onay veya red anı
});
```
`customers` tablosuna BU ADIMDA HİÇBİR KOLON EKLENMEZ — sadece Adım 6'da
belirtilen tek kolon (`registrationSource`) eklenecek, o da bilgi amaçlı.

### 1c. `customers` tablosu — tek kolon
```typescript
registrationSource: text("registration_source").notNull().default("CASHIER_INVITE"),
// CASHIER_INVITE | QR_SELF_REGISTER
```

### 1d. Yeni tablo — `registration_attempts` (rate limit)
```typescript
export const registrationAttempts = sqliteTable("registration_attempts", {
  id: text("id").primaryKey(),
  ip: text("ip").notNull(),
  orgId: text("org_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
```

### 1e. Yeni tablo — `activity_logs`
```typescript
export const activityLogs = sqliteTable("activity_logs", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  type: text("type").notNull(),
  // QR_REGISTRATION_REQUESTED | REGISTRATION_APPROVED | REGISTRATION_REJECTED
  // | POINTS_EARNED | POINTS_REDEEMED
  actorName: text("actor_name"),
  actorRole: text("actor_role"), // CASHIER | MANAGER | BOSS | SYSTEM | CUSTOMER
  targetName: text("target_name"),
  description: text("description").notNull(),
  metadata: text("metadata"), // JSON string, opsiyonel
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  orgTimeIdx: index("activity_logs_org_time_idx").on(t.orgId, t.createdAt),
}));
```
`(orgId, createdAt)` index KASITLI — Canlı İşlem Akışı sayfası bu index'ten
tek tablo taramasıyla okuyacak, join yok.

### 1f. Mevcut orglar için `registrationCode` backfill
`scripts/` klasöründe tek seferlik script, `registrationCode` NULL olan
org'lara rastgele unique kod atasın.

### Bunu nasıl doğrulayabilirim
- Tüm yeni tablo/kolonların DB'de oluştuğunu göster.
- Var olan bir müşteri kaydında `registrationSource='CASHIER_INVITE'`
  default'unun geldiğini göster.
- `activity_logs` üzerinde `(orgId, createdAt)` index'inin oluştuğunu göster.

---

## Adım 2 — Org Oluşturmada Kod Üretimi
(Değişmedi — `createOrganization` action'ında `registrationCode` üretimi,
unique çakışma kontrolüyle.)

---

## Adım 3 — Public Kayıt Sayfası
(Değişmedi — `src/app/kayit/[registrationCode]/page.tsx`, form. Turnstile/CAPTCHA
bu aşamada EKLENMİYOR, kapsam dışı bırakıldı — sadece IP bazlı rate limit ile
başlanıyor, ileride gerekirse ayrı bir görev olarak eklenir.)

---

## Adım 4 — Server Action: Kayıt Gönderimi (GÜNCELLENDİ)

Dosya: `src/app/kayit/actions.ts`

```typescript
export async function submitCustomerRegistration(
  registrationCode: string,
  data: { name: string; email: string; phone: string; password: string }
) {
  // 1. registrationCode ile org'u bul
  // 2. IP al, rate limit kontrolü (registration_attempts, son 1 saat)
  // 3. registration_attempts'e bu denemeyi kaydet
  // 4. Duplicate kontrolü — İKİ tabloya bakılır:
  //    a) customers tablosunda bu email/telefon var mı (her zaman geçerli müşteri)
  //    b) customer_registration_requests'te status='PENDING_APPROVAL' olan
  //       bir kayıt var mı (zaten bekleyen bir talep varsa tekrar oluşturma)
  //    REJECTED durumundaki eski talepler duplicate SAYILMAZ — engellenmez.
  // 5. Clerk kullanıcısı oluştur (normalizePhoneToUsername kullan, mevcut
  //    invitation-service'teki fonksiyonu import et)
  // 6. customer_registration_requests'e insert (customers'a DEĞİL):
  //    status: "PENDING_APPROVAL"
  // 7. activity_logs'a insert:
  //    type: "QR_REGISTRATION_REQUESTED", targetName: data.name,
  //    actorRole: "CUSTOMER",
  //    description: `${data.name} QR ile kayıt talebinde bulundu`
  // 8. return { success: true }
}
```

### Yapma
- `customers` tablosuna bu adımda HİÇ insert yapma.
- Duplicate kontrolünde REJECTED kayıtları hariç tutmayı unutma — bu olmadan
  reddedilen kullanıcı bir daha asla kayıt olamaz.

### Bunu nasıl doğrulayabilirim
- Formu doldur, `customer_registration_requests`'te satır oluştuğunu,
  `customers`'ta OLUŞMADIĞINI göster.
- `activity_logs`'ta ilgili satırın oluştuğunu göster.
- Rate limit testi (Adım 4'ün eski hali gibi).

---

## Adım 5 — Giriş Engeli (BASİTLEŞTİ)

Müşteri layout guard'ında: giriş yapan Clerk kullanıcısının `customers`
tablosunda karşılığı YOKSA → `/onay-bekleniyor` sayfasına yönlendir.
(`customer_registration_requests`'ten status'e bakıp PENDING/REJECTED farkını
mesajda gösterebilirsin ama zorunlu değil.)

`customers`'ta kayıt varsa zaten her zaman aktif müşteridir — ekstra
`status` kontrolüne gerek yok, çünkü onaylanmamış biri o tabloya hiç girmedi.

### Bunu nasıl doğrulayabilirim
- Bekleyen (customers'ta olmayan) bir Clerk hesabıyla giriş yap,
  `/onay-bekleniyor`'a yönlendiğini göster.

---

## Adım 6 — Kasiyer "Onay Bekleyenler" Sayfası (GÜNCELLENDİ)

- Listeleme: `customer_registration_requests` where `orgId=...`,
  `status='PENDING_APPROVAL'`.
- **Onayla** → `approveCustomerRegistration(requestId)`:
  1. `customers` tablosuna YENİ satır insert et: `registrationSource: "QR_SELF_REGISTER"`,
     talepteki name/email/phone/clerkUserId ile.
  2. `customer_registration_requests.status = "APPROVED"`,
     `approvedByCashierId`, `decidedAt` güncelle.
  3. `activity_logs`'a insert: `type: "REGISTRATION_APPROVED"`,
     `actorName: <kasiyer adı>`, `actorRole: "CASHIER"`, `targetName: <müşteri adı>`.
- **Reddet** → `rejectCustomerRegistration(requestId)`:
  1. Clerk kullanıcısını SİL (`clerkClient.users.deleteUser`) — önce bu,
     sonra DB güncelle (sıra önemli, ters sırada tutarsızlık riski var).
  2. `customer_registration_requests.status = "REJECTED"`, `decidedAt` güncelle.
  3. `activity_logs`'a insert: `type: "REGISTRATION_REJECTED"`,
     `actorName: <kasiyer adı>`, `actorRole: "CASHIER"`, `targetName: <müşteri adı>`.

### Bunu nasıl doğrulayabilirim
- Onayla → `customers`'ta yeni satır, `activity_logs`'ta log oluştuğunu göster,
  müşterinin artık giriş yapabildiğini doğrula.
- Reddet → Clerk'te kullanıcının silindiğini, sonra aynı bilgiyle Adım 4'ü
  tekrar deneyip başarılı olduğunu göster.

---

## Adım 7 — QR Kodu Görüntüleme (Patron Paneli)
(Değişmedi — `qrcode.react` ile `registrationCode`'u QR olarak göster.)

---

## Adım 8 — Yönetici Canlı İşlem Akışı Sayfası (YENİ)

Yöneticinin genel bakış ekranındaki "Canlı İşlem Akışı" bölümü artık
`activity_logs` tablosundan okunur — HİÇBİR join yapılmaz:

```typescript
export async function getRecentActivity(orgId: string, limit = 50) {
  return db.select().from(activityLogs)
    .where(eq(activityLogs.orgId, orgId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}
```

UI: her satır `description` + `createdAt` (göreli zaman, "5 dakika önce" gibi)
+ `type`'a göre bir ikon. Ekstra sorgu/join gerekmiyor, `description` alanı
zaten okunabilir Türkçe cümle olarak yazıldı (Adım 4/6'da).

### Yapma
- Bu sayfada `customers`/`customer_registration_requests`/`transactions`
  tablolarına HİÇ sorgu atma — sadece `activity_logs`.

### Bunu nasıl doğrulayabilirim
- Adım 4/6'daki test işlemlerinden sonra bu sayfayı aç, oluşan logların
  kronolojik sırayla göründüğünü göster.

---

## Adım 9 — Mevcut Transaction Service'e Log Ekleme

Daha önce `lastActiveAt` güncellemesi eklediğimiz transaction service
dosyasına (kampanya görevinde Adım 2), AYNI noktaya (transaction insert
edildikten hemen sonra) bir `activity_logs` insert daha ekle:

```typescript
await db.insert(activityLogs).values({
  id: crypto.randomUUID(),
  orgId: customer.orgId,
  type: transaction.type === "EARN" ? "POINTS_EARNED" : "POINTS_REDEEMED",
  actorName: cashierName, // işlemi yapan kasiyer
  actorRole: "CASHIER",
  targetName: customer.name,
  description: transaction.type === "EARN"
    ? `${customer.name} adlı müşteriye ${cashierName} tarafından ${amount} puan kazandırıldı`
    : `${customer.name} adlı müşteri ${amount} puan harcadı (${cashierName})`,
  createdAt: new Date(),
});
```

### Yapma
- Transaction service'in başka hiçbir kısmına dokunma, sadece bu insert'i ekle.
- `lastActiveAt` update'ini SİLME veya değiştirme — o hâlâ orada kalacak,
  bu ek bir satır, yerine geçmiyor.

### Bunu nasıl doğrulayabilirim
- Manuel puan ekle/harca, `activity_logs`'ta ilgili satırın oluştuğunu göster,
  Adım 8'deki sayfada göründüğünü doğrula.

---

## Genel Kısıtlar (Tüm Adımlar İçin)

- Server Action'larda `throw` YOK.
- Mevcut kasiyer-eliyle-davet akışına dokunma.
- `normalizePhoneToUsername` ve mevcut duplicate-check mantığını yeniden yazma.
- Cross-dashboard import yasak.
- KVKK notu: `activity_logs` bilinçli olarak SİLİNMEYECEK/anonimleştirilmeyecek
  şekilde tasarlandı (kullanıcı kararı) — agent bu tabloya otomatik silme/
  temizleme job'ı YAZMASIN, böyle bir talep gelmedi.
- Clerk secret'larını koda yazma, env kullan.
- Her adım sonunda standart rapor formatı: kullanılan ajan/skill, incelenen
  referans dosya, değiştirilen dosyalar, doğrulama çıktısı.
