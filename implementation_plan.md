# Okut Kazan - SEO Optimizasyonu ve Marka Dönüşüm Planı

Bu plan, uygulamanın markasının tamamen "Okut Kazan" olarak güncellenmesini ve uygulamanın `@[.agent/skills/seo-fundamentals]` ile `seo-specialist` yönergelerine göre optimize edilmesini içerir.

## User Review Required

Lütfen SEO için oluşturulan meta başlık ve açıklamaları, ayrıca açık soruları (Open Questions) gözden geçirin.

> [!IMPORTANT]
> **Open Questions (Uygulama Fikri İçin SEO Stratejisi Soruları):**
> 1. **Hedef Kitle (Persona):** Okut Kazan sistemini en çok kimler (örneğin restoran sahipleri, perakende mağazaları, kuaförler vs.) kullanacak? Buna göre anahtar kelimeleri (keywords) daraltabiliriz.
> 2. **E-E-A-T (Deneyim ve Güvenilirlik):** Sitede gösterebileceğimiz "Şu kadar işletme bizi kullanıyor" veya "Şu güvenlik sertifikalarına sahibiz" gibi somut referans/istatistik var mı? AI arama motorları (GEO) bu tür istatistikleri kaynak göstermeyi çok sever.
> 3. **FAQ (Sıkça Sorulan Sorular):** Landing page üzerinde bir SSS (FAQ) bölümü açmalı mıyız? GEO (Generatif AI Optimizasyonu) açısından FAQ yapısal verisi (Schema Markup) çok etkilidir.
> 4. **Ana Rakipler:** Arama motorlarında kime rakip olmak istiyorsunuz?

## Proposed Changes

### Genel Marka Dönüşümü (Loyalty -> Okut Kazan)

#### [MODIFY] [layout.tsx](file:///Users/alperensongut/Desktop/LoyalityPointApp/src/app/layout.tsx)
- `LoyaltyPoints` ve `Loyalty` geçen tüm metinler `Okut Kazan` olarak değiştirilecek.
- Eski domain örneği (`loyaltypoints.app`) yeni marka ismine uyarlanacak (örn. `okutkazan.com.tr` veya `.app`).

#### [MODIFY] [ManagerSidebar.tsx](file:///Users/alperensongut/Desktop/LoyalityPointApp/src/components/features/manager-dashboard/ui/ManagerSidebar.tsx)
- "Loyalty OS" ibaresi "Okut Kazan OS" olarak güncellenecek.

#### [MODIFY] [DigitalWalletCard.tsx](file:///Users/alperensongut/Desktop/LoyalityPointApp/src/components/features/customer-dashboard/ui/DigitalWalletCard.tsx)
- "Loyalty Card" metni "Okut Kazan Kartı" olarak güncellenecek.

#### [MODIFY] [QrProcessTab.tsx](file:///Users/alperensongut/Desktop/LoyalityPointApp/src/components/features/cashier-dashboard/ui/QrProcessTab.tsx)
- "Scan Loyalty Pass" metni "Okut Kazan Pass Okut" olarak güncellenecek.

### SEO ve GEO Optimizasyonları

#### [MODIFY] [layout.tsx](file:///Users/alperensongut/Desktop/LoyalityPointApp/src/app/layout.tsx)
- **Title Tag:** 50-60 karakter sınırına uyacak şekilde optimize edilecek: `"Okut Kazan | Yeni Nesil QR Kodlu Sadakat Sistemi"`
- **Meta Description:** 150-160 karakter sınırına uygun ve CTA içeren yapı: `"Okut Kazan ile işletmenizi büyütün. Çok şubeli işletmeler için tasarlanmış modern, güvenli ve hızlı QR kod tabanlı müşteri sadakat ve puan platformu."`
- **Keywords:** Eski (ve alakasız "LC Waikiki sadakat" gibi) anahtar kelimeler temizlenerek, hedefe uygun kelimeler (QR kod sadakat, müşteri puan sistemi, dijital cüzdan vb.) eklenecek.
- **OpenGraph ve Twitter Kartları:** Sosyal medya paylaşımları için `og:title`, `og:description` ve `twitter:title` güncellenecek.
- **Organization / SoftwareApplication Schema Markup:** Sayfanın `<head>` bölümüne JSON-LD formatında Yapısal Veri (Schema) eklenecek. Bu, arama motorlarının uygulamanın ne olduğunu daha net anlamasını sağlar.

## Verification Plan

### Automated Tests
- TypeScript hataları `npm run build` ile doğrulanacak.
- Sayfaların meta verileri kontrol edilecek.

### Manual Verification
- Kullanıcının açık sorulara verdiği yanıtlara göre varsa yeni `FAQPage` yapısal verileri entegre edilecek.
