# Global Kural: Otomatik Yönlendirme, Mimari Koruma, Belirsizlik Yönetimi

Bu dosya `.agents/rules/project.md` dosyasından BAĞIMSIZ olarak tutulur çünkü kapsamı
proje-spesifik değil, süreç-spesifiktir (routing, mimari koruma, belirsizlik yönetimi).
`project.md` "Okut Kazan'da ne var" sorusuna cevap verir, bu dosya "her istek nasıl
işlenir" sorusuna cevap verir. Antigravity çoklu rule dosyasını otomatik okumuyorsa,
`project.md`'nin en üstüne şu satırı ekle: `Önce .agents/rules/auto-routing.md dosyasını oku ve uygula.`

---

## 1. Zorunlu Otomatik Yönlendirme (Kullanıcı Ajan/Skill Belirtmeyecek)

**Kural:** Her istek geldiğinde, kod yazmadan ÖNCE, `intelligent-routing` skill'i
otomatik çalıştırılır. Kullanıcının "backend-specialist kullan" veya
"database-design skill'ini uygula" gibi açık isimlendirme yapması BEKLENMEZ —
bu artık varsayılan, atlanamaz bir ön adımdır.

**İşleyiş:**
1. İstek analiz edilir: hangi katmanları etkiliyor (UI / service / action / şema / auth)?
2. Skill tablosundan (mevcut rapor) eşleşen skill(ler) belirlenir.
3. Uygun ajan(lar) seçilir. Tek katmanlı iş → tek ajan. Çok katmanlı iş
   (örn. şema + service + UI birden) → `orchestrator` devreye girer.
4. Seçilen ajan/skill kombinasyonu, kodlamaya başlamadan ÖNCE tek satırlık özet
   olarak raporlanır: `Kullanılan: backend-specialist + database-design + clean-code`.
   Bu, kullanıcının "yanlış ajan seçildi" deme şansını kodlama başlamadan verir.

**Kullanıcı override edebilir:** "Sadece frontend-specialist kullan" gibi açık bir
talimat varsa, otomatik routing'i geçersiz kılar. Ama varsayılan davranış her zaman
otomatik seçimdir.

---

## 2. Zorunlu Mimari Ön Kontrol (Tier 0 — Atlanamaz)

**Sorun:** Ajan bazen "işi bitirmek" için proje mimarisini (Next.js App Router,
Server Components/Server Actions, service→action katmanlaşması) görmezden gelip
client-side fetching veya sayfa yapısına uymayan çözümler üretiyor.

**Kural:** Herhangi bir dosya oluşturmadan/değiştirmeden ÖNCE, ajan şunları yapmak
ZORUNDADIR:

1. Değişikliğin yapılacağı klasörün mevcut yapısını `view`/`ls` ile incele —
   varsayımla ("muhtemelen buradadır") değil, gerçek dosya listesiyle.
2. Aynı türde (örn. başka bir dashboard'un action dosyası) en az 1 mevcut örneği
   oku ve o örneğin pattern'ini (Server Action mı Route Handler mı, service
   katmanı var mı, hata formatı ne) çıkar.
3. Yeni kod bu pattern'e UYMAK zorunda. Uymayacaksa (örn. mevcut kod yanlış
   yazılmış, düzeltilmesi gerekiyor), bunu SESSİZCE değiştirmek yerine önce
   kullanıcıya bildirir: `"Mevcut pattern X ama bu yaklaşım Y sorununa yol açıyor,
   Z şeklinde değiştirmemi ister misin?"`

**Açık yasaklar (proje.md'deki kurallarla birlikte okunur):**
- Server Component/Server Action'ın yeterli olduğu bir yerde client-side
  `useEffect` + `fetch` ile veri çekme YASAK (App Router'ın SSR avantajını çökertir).
- "Çalışsın diye" yeni bir mimari desen (örn. yeni bir state management kütüphanesi,
  yeni bir veri çekme yöntemi) tanıtmak YASAK — mevcut projede zaten çözülmüş bir
  problem için yeni yöntem icat edilmez.
- Klasör yapısını kontrol etmeden "muhtemelen böyledir" varsayımıyla dosya yolu
  üretmek YASAK.

**Bunu nasıl doğrularım:** Her rapor sonunda ajan şunu eklemeli:
`İncelenen referans dosya: <yol>. Uygulanan pattern: <kısa açıklama>.`
Bu satır yoksa, ön kontrol atlanmış demektir — reddet, tekrar iste.

---

## 3. Belirsizlik Yönetimi (Genişletilmiş Sokratik Kapı)

Mevcut kural (belirsiz istekte en az 3 soru sor) yetersiz kalıyor çünkü "belirsiz"
tanımı net değildi. Somutlaştırma:

**Tetikleyiciler (bunlardan biri varsa dur, soru sor):**
- Belirsiz fiil kullanımı: "düzenle", "iyileştir", "hallet", "daha iyi yap" —
  somut bir hedef/kabul kriteri olmadan.
- Aynı problemi çözmenin birden fazla geçerli mimari yolu varsa (örn. "bildirim
  ekle" → real-time mi, polling mi, email mi belirtilmemiş).
- İsteğin proje mimarisiyle çelişme ihtimali varsa (örn. "hızlıca client'ta çek"
  denmiş ama proje SSR-first).

**Soru sorma formatı — düz liste değil, SEÇENEKLİ:**
Kullanıcı (Alperen) veri odaklı, hızlı karar vermeyi tercih ediyor — açık uçlu
soru yerine numaralı seçenek + trade-off sun:

```
Net değil, 3 olası yaklaşım var:
1. [Yaklaşım A] — Avantaj: X. Dezavantaj: Y.
2. [Yaklaşım B] — Avantaj: X. Dezavantaj: Y.
3. [Yaklaşım C] — Avantaj: X. Dezavantaj: Y.
Hangisi?
```

**Tetiklenmiyorsa:** İstek zaten somut adımlara bölünmüşse (bu belgedeki gibi
"Adım 1: şu dosyada şu değişiklik" formatında), soru sorma — direkt uygula.
Fazla soru sormak da bir sorun; net promptlarda durmadan devam et.

---

## 4. Standart Rapor Formatı (Her Görev Sonunda — Tekrar Yazılmasına Gerek Yok)

```
## Kullanılan ajan/skill: <liste>
## İncelenen referans dosya: <yol> — Uygulanan pattern: <özet>
## Değiştirilen/oluşturulan dosyalar:
- <yol> — <ne değişti, kaç satır>
## Doğrulama:
- <çalıştırılan komut/sorgu> → <gerçek çıktı>
## Onay bekleniyor: [sıradaki adım / bitti]
```

Bu format `project.md`'deki "throw yok", "cross-dashboard import yok" gibi kurallarla
birlikte her raporda otomatik uygulanır — kullanıcı her seferinde format istemek
zorunda kalmaz.
