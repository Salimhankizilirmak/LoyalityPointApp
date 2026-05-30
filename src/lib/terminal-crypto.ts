/**
 * @module terminal-crypto
 * @description Hardware-Bound HMAC doğrulama motoru ve Replay Attack Shield.
 *
 * İmza formülü: HMAC_SHA256(secretKey, nonce + JSON.stringify(rawBody))
 * Nonce kullanımı: tek kullanımlık (one-shot), kullanıldıktan hemen sonra silinir.
 */

import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import { db } from "@/db";
import { terminals, terminalChallenges } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";

// ─── Sabitler ────────────────────────────────────────────────────────────────

const NONCE_TTL_SECONDS = 30;

// ─── Tip Tanımları ────────────────────────────────────────────────────────────

export interface TerminalAuthResult {
  success: boolean;
  terminalId?: string;
  branchId?: string | null;
  error?: string;
}

export interface NonceLookup {
  nonce: string;
  terminalId: string;
  expiresAt: Date;
}

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────

/**
 * Verilen secretKey ve payload için HMAC-SHA256 imzası üretir.
 * Zamana bağlı yan kanal (timing side-channel) saldırılarına karşı
 * güvenli karşılaştırma için timingSafeEqual kullanılır.
 */
function computeHmac(secretKey: string, payload: string): Buffer {
  return Buffer.from(
    createHmac("sha256", secretKey).update(payload, "utf8").digest("hex"),
    "utf8"
  );
}

/**
 * Süresi dolmuş nonce kayıtlarını veritabanından temizler.
 * Her handshake isteği öncesinde çağrılarak veritabanını hafif tutar.
 */
export async function purgeExpiredNonces(): Promise<void> {
  const now = new Date();
  await db
    .delete(terminalChallenges)
    .where(lt(terminalChallenges.expiresAt, now));
}

// ─── Temel API ────────────────────────────────────────────────────────────────

/**
 * Yeni bir tek kullanımlık nonce (challenge token) üretir ve veritabanına yazar.
 * @param terminalId Doğrulanmış ve aktif terminalin veritabanı ID'si
 * @returns Üretilen nonce string değeri
 */
export async function issueNonce(terminalId: string): Promise<string> {
  await purgeExpiredNonces();

  const nonce = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + NONCE_TTL_SECONDS * 1000);

  await db.insert(terminalChallenges).values({
    terminalId,
    nonce,
    expiresAt,
  });

  return nonce;
}

/**
 * Gelen isteğin HMAC imzasını doğrular ve Replay Attack Shield'i tetikler.
 *
 * Akış:
 * 1. hardwareHash ile terminali sorgula.
 * 2. Terminal aktif değilse reddedilir.
 * 3. Nonce'u terminal_challenges tablosundan çek; yoksa veya süresi geçmişse reddedilir.
 * 4. HMAC imzasını sunucu tarafında hesapla ve karşılaştır.
 * 5. İmza geçerliyse nonce'u anında sil (Replay Shield) ve işlemi onayla.
 *
 * @param hardwareHash Terminale ait donanım özeti
 * @param nonce İstemcinin X-Terminal-Nonce header ile gönderdiği tek kullanımlık token
 * @param signature İstemcinin X-Terminal-Signature header ile gönderdiği HMAC imzası
 * @param rawBody İmzalanan ham istek gövdesi (JSON.stringify edilmiş)
 */
export async function validateTerminalSignature(
  hardwareHash: string,
  nonce: string,
  signature: string,
  rawBody: unknown
): Promise<TerminalAuthResult> {
  // Adım 1: Terminal Sorgusu
  const terminal = await db
    .select()
    .from(terminals)
    .where(eq(terminals.hardwareHash, hardwareHash))
    .get();

  if (!terminal) {
    return { success: false, error: "Terminal bulunamadı." };
  }

  if (!terminal.isActive) {
    return { success: false, error: "Terminal onay bekliyor veya askıya alınmış." };
  }

  // Adım 2: Nonce Doğrulaması
  const now = new Date();
  const challenge = await db
    .select()
    .from(terminalChallenges)
    .where(
      and(
        eq(terminalChallenges.nonce, nonce),
        eq(terminalChallenges.terminalId, terminal.id)
      )
    )
    .get();

  if (!challenge) {
    return { success: false, error: "Geçersiz veya kullanılmış nonce." };
  }

  if (challenge.expiresAt < now) {
    // Süresi dolmuş nonce'u temizle
    await db.delete(terminalChallenges).where(eq(terminalChallenges.id, challenge.id));
    return { success: false, error: "Nonce süresi dolmuş." };
  }

  // Adım 3: HMAC İmzası Doğrulaması
  const payload = nonce + JSON.stringify(rawBody);
  const expectedSig = computeHmac(terminal.secretKey, payload);

  let clientSig: Buffer;
  try {
    clientSig = Buffer.from(signature, "utf8");
  } catch {
    return { success: false, error: "İmza formatı geçersiz." };
  }

  // Eşit uzunluk kontrolü (timingSafeEqual zorunlu şartı)
  if (expectedSig.length !== clientSig.length) {
    // Replay Shield: Başarısız denemelerde nonce'u hemen sil (brute-force engeli)
    await db.delete(terminalChallenges).where(eq(terminalChallenges.id, challenge.id));
    return { success: false, error: "İmza doğrulaması başarısız." };
  }

  const isValid = timingSafeEqual(expectedSig, clientSig);

  if (!isValid) {
    // Replay Shield: Hatalı imzada nonce'u anında imha et
    await db.delete(terminalChallenges).where(eq(terminalChallenges.id, challenge.id));
    return { success: false, error: "İmza doğrulaması başarısız." };
  }

  // Adım 4: Replay Shield — Başarılı doğrulamada nonce'u imha et
  await db.delete(terminalChallenges).where(eq(terminalChallenges.id, challenge.id));

  // Adım 5: lastSeenAt güncelleme (non-blocking, hata critical değil)
  db.update(terminals)
    .set({ lastSeenAt: Math.floor(Date.now() / 1000) })
    .where(eq(terminals.id, terminal.id))
    .run()
    .catch((err) => console.warn("[TerminalCrypto] lastSeenAt güncellenemedi:", err));

  return {
    success: true,
    terminalId: terminal.id,
    branchId: terminal.branchId,
  };
}
