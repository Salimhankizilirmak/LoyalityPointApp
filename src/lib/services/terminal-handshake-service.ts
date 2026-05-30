/**
 * @module terminal-handshake-service
 * @description Handshake iş mantığını route handler'dan ayırır.
 * SOLID SRP: Route = HTTP arayüzü, Service = iş mantığı.
 */

import { db } from "@/db";
import { terminals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { issueNonce, purgeExpiredNonces } from "@/lib/terminal-crypto";

const PENDING_TERMINAL_NAME = "Yeni POS Terminali (Onay Bekliyor)";

export interface HandshakeResult {
  status: "nonce_issued" | "pending_approval" | "disabled" | "error";
  nonce?: string;
  message: string;
}

/**
 * Handshake akışını orchestrate eder:
 * 1. hardwareHash ile terminali ara.
 * 2. Bulunamadıysa → isActive: false ile PENDING kayıt oluştur, 401 dön.
 * 3. Bulundu fakat isActive: false ise → 401 dön.
 * 4. Aktif terminal ise → nonce üret ve 200 dön.
 */
export async function processHandshake(
  hardwareHash: string
): Promise<HandshakeResult> {
  await purgeExpiredNonces();

  const terminal = await db
    .select()
    .from(terminals)
    .where(eq(terminals.hardwareHash, hardwareHash))
    .get();

  // Bilinmeyen terminal: PENDING kaydı oluştur
  if (!terminal) {
    await db.insert(terminals).values({
      branchId: null,
      name: PENDING_TERMINAL_NAME,
      hardwareHash,
      secretKey: "",  // Onay sonrasında yönetici panelinden atanacak
      isActive: false,
    }).onConflictDoNothing();

    return {
      status: "pending_approval",
      message: "Terminal onay bekliyor. Lütfen yöneticinizle iletişime geçin.",
    };
  }

  // Pasif / askıya alınmış terminal
  if (!terminal.isActive) {
    return {
      status: "disabled",
      message: "Terminal onay bekliyor veya devre dışı bırakılmış.",
    };
  }

  // Aktif terminal: nonce üret
  const nonce = await issueNonce(terminal.id);

  return {
    status: "nonce_issued",
    nonce,
    message: "El sıkışma başarılı.",
  };
}
