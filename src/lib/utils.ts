import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Türk telefon numarasını Clerk username-safe formata normalize eder.
 * Sonuç: 905321234567 (12 hane, sadece rakam)
 *
 * Örnekler:
 *   +90 532 123 45 67  → 905321234567
 *   0532 123 45 67     → 905321234567
 *   5321234567         → 905321234567
 *   905321234567       → 905321234567
 */
export function normalizePhoneToUsername(phone: string): string {
  // Tüm boşluk, +, -, (, ) karakterlerini temizle
  let cleaned = phone.replace(/[\s+\-()]/g, "");
  // Eğer 0 ile başlıyorsa ve 11 haneliyse, başındaki 0'ı
  // kaldırıp 90 ekle (05321234567 -> 905321234567)
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = "90" + cleaned.substring(1);
  }
  // Eğer 10 haneliyse (5321234567) başına 90 ekle
  if (cleaned.length === 10) {
    cleaned = "90" + cleaned;
  }
  return cleaned; // beklenen sonuç: 905321234567 (12 hane)
}

/**
 * Türk telefon numarasının geçerliliğini normalize sonrası doğrular.
 * Geçerli sonuç: 90 + 10 rakam = 12 hane toplam.
 */
export function isValidTurkishPhone(phone: string): boolean {
  const normalized = normalizePhoneToUsername(phone);
  return /^90[0-9]{10}$/.test(normalized);
}

/**
 * Telefon numarasını sadece 10 haneli ham string (5XXXXXXXXX) formatına temizler.
 * Başındaki +90, 90, 0 kodlarını ve tüm sayısal olmayan karakterleri temizler.
 */
export function sanitizePhoneTo10(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("90") && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

