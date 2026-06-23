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
  let cleaned = phone.replace(/[\s+\-()]/g, "");
  
  // 905XXXXXXXXX → 05XXXXXXXXX (başındaki 90 kaldır, 0 ekle)
  if (cleaned.startsWith("90") && cleaned.length === 12) {
    cleaned = "0" + cleaned.substring(2);
  }
  // 5XXXXXXXXX → 05XXXXXXXXX (başına 0 ekle)
  if (cleaned.startsWith("5") && cleaned.length === 10) {
    cleaned = "0" + cleaned;
  }
  // 05XXXXXXXXX → olduğu gibi kalsın
  return cleaned;
}

export function isValidTurkishPhone(phone: string): boolean {
  const normalized = normalizePhoneToUsername(phone);
  return /^05[0-9]{9}$/.test(normalized);
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

