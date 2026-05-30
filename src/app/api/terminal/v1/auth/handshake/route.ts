/**
 * POST /api/terminal/v1/auth/handshake
 *
 * Fiziksel POS terminalinin sunucuyla el sıkışmasını sağlar.
 * Bilinmeyen terminalleri PENDING olarak otomatik kaydeder.
 * Aktif terminallere tek kullanımlık nonce (challenge token) verir.
 *
 * Body: { hardwareHash: string }
 * Response 200: { nonce: string }
 * Response 401: { error: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processHandshake } from "@/lib/services/terminal-handshake-service";

const HandshakeBodySchema = z.object({
  hardwareHash: z.string().min(64).max(128).regex(/^[a-f0-9]+$/, "Geçersiz hash formatı"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
  }

  const parsed = HandshakeBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Doğrulama hatası.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { hardwareHash } = parsed.data;

  try {
    const result = await processHandshake(hardwareHash);

    if (result.status === "nonce_issued") {
      return NextResponse.json({ nonce: result.nonce }, { status: 200 });
    }

    // pending_approval veya disabled → 401
    return NextResponse.json({ error: result.message }, { status: 401 });
  } catch (err) {
    console.error("[Handshake] İşlem hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
