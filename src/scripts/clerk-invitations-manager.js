#!/usr/bin/env node

/**
 * Clerk Invitations Manager CLI
 * 
 * Kullanım:
 *   node src/scripts/clerk-invitations-manager.js --sync
 *   node src/scripts/clerk-invitations-manager.js --revoke <email>
 *   node src/scripts/clerk-invitations-manager.js --list
 * 
 * --sync          : Clerk'teki bekleyen davetiyeleri Turso invitations tablosuna eşitler
 * --revoke <email>: Belirtilen e-postanın Clerk davetiyesini iptal eder ve yerel DB'yi günceller
 * --list          : Yerel Turso veritabanındaki tüm davetiyeleri listeler
 */

const path = require("path");

// .env.local dosyasından ortam değişkenlerini yükle
require("dotenv").config({ path: path.resolve(__dirname, "../../.env.local") });

const { createClerkClient } = require("@clerk/backend");
const { createClient } = require("@libsql/client");

// ─── BAĞLANTILAR ─────────────────────────────────────────────────────────────

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// ─── YARDIMCI FONKSİYONLAR ──────────────────────────────────────────────────

function log(emoji, message) {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`[${timestamp}] ${emoji} ${message}`);
}

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// ─── --sync MODU ─────────────────────────────────────────────────────────────

async function syncInvitations() {
  log("🔄", "Clerk davetiye eşitlemesi başlatılıyor...");

  let clerkInvitations;
  try {
    const response = await clerk.invitations.getInvitationList({ status: "pending" });
    clerkInvitations = response.data || response;
  } catch (err) {
    log("❌", `Clerk API'den davetiyeler çekilemedi: ${err.message}`);
    return;
  }

  if (!clerkInvitations || clerkInvitations.length === 0) {
    log("📭", "Clerk üzerinde bekleyen davetiye bulunamadı.");
    return;
  }

  log("📬", `Clerk'te ${clerkInvitations.length} bekleyen davetiye bulundu.`);

  let upserted = 0;
  let skipped = 0;

  for (const inv of clerkInvitations) {
    const email = inv.emailAddress?.toLowerCase();
    if (!email) {
      skipped++;
      continue;
    }

    // publicMetadata'dan orgId'yi çıkart
    const orgId = inv.publicMetadata?.orgId || null;
    if (!orgId) {
      log("⚠️", `  → ${email}: publicMetadata.orgId bulunamadı, atlanıyor.`);
      skipped++;
      continue;
    }

    // Organizasyonun yerel veritabanında var olduğunu doğrula
    const orgCheck = await turso.execute({
      sql: `SELECT id FROM organizations WHERE id = ?`,
      args: [orgId],
    });

    if (orgCheck.rows.length === 0) {
      log("⚠️", `  → ${email}: Organizasyon (${orgId}) yerel DB'de yok, atlanıyor.`);
      skipped++;
      continue;
    }

    // invitedBy (Süper Admin) - ilk süper admini bul
    const superAdmin = await turso.execute({
      sql: `SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1`,
      args: [],
    });

    const invitedById = superAdmin.rows.length > 0 ? superAdmin.rows[0].id : null;
    if (!invitedById) {
      log("⚠️", `  → ${email}: Yerel DB'de SUPER_ADMIN bulunamadı, atlanıyor.`);
      skipped++;
      continue;
    }

    const clerkInviteId = inv.id;
    const createdAtUnix = inv.createdAt ? Math.floor(inv.createdAt / 1000) : Math.floor(Date.now() / 1000);
    const expiresAtUnix = createdAtUnix + 604800; // 7 gün
    const localId = generateId();

    try {
      await turso.execute({
        sql: `INSERT INTO invitations (id, clerk_invite_id, email, organization_id, role, status, invited_by, created_at, expires_at)
              VALUES (?, ?, ?, ?, 'BOSS', 'PENDING', ?, ?, ?)
              ON CONFLICT(clerk_invite_id) DO UPDATE SET
                status = 'PENDING',
                email = excluded.email,
                organization_id = excluded.organization_id`,
        args: [localId, clerkInviteId, email, orgId, invitedById, createdAtUnix, expiresAtUnix],
      });

      log("✅", `  → ${email} (${clerkInviteId}) eşitlendi.`);
      upserted++;
    } catch (dbErr) {
      log("❌", `  → ${email} DB upsert hatası: ${dbErr.message}`);
    }
  }

  log("📊", `Eşitleme tamamlandı: ${upserted} upsert, ${skipped} atlandı.`);
}

// ─── --revoke MODU ───────────────────────────────────────────────────────────

async function revokeByEmail(targetEmail) {
  const email = targetEmail.trim().toLowerCase();
  log("🎯", `"${email}" için davet iptali başlatılıyor...`);

  // 1. Clerk'te bu e-posta için bekleyen davetiyeleri tara
  let clerkInvitations;
  try {
    const response = await clerk.invitations.getInvitationList({ status: "pending" });
    clerkInvitations = (response.data || response).filter(
      (inv) => inv.emailAddress?.toLowerCase() === email
    );
  } catch (err) {
    log("❌", `Clerk API taraması başarısız: ${err.message}`);
    return;
  }

  if (clerkInvitations.length === 0) {
    log("📭", `Clerk'te "${email}" için bekleyen davetiye bulunamadı.`);

    // Yerel DB'de kalan kayıtları da REVOKED olarak işaretle
    const localUpdate = await turso.execute({
      sql: `UPDATE invitations SET status = 'REVOKED' WHERE email = ? AND status = 'PENDING'`,
      args: [email],
    });
    if (localUpdate.rowsAffected > 0) {
      log("🧹", `Yerel DB'de ${localUpdate.rowsAffected} kayıt REVOKED olarak güncellendi.`);
    }
    return;
  }

  log("🔍", `Clerk'te ${clerkInvitations.length} adet bekleyen davetiye bulundu.`);

  for (const inv of clerkInvitations) {
    // Clerk'ten iptal et
    try {
      await clerk.invitations.revokeInvitation(inv.id);
      log("✅", `  → Clerk davetiyesi iptal edildi: ${inv.id}`);
    } catch (revokeErr) {
      log("❌", `  → Clerk iptal hatası (${inv.id}): ${revokeErr.message}`);
      continue;
    }

    // Yerel DB'yi güncelle
    try {
      const result = await turso.execute({
        sql: `UPDATE invitations SET status = 'REVOKED' WHERE clerk_invite_id = ?`,
        args: [inv.id],
      });

      if (result.rowsAffected > 0) {
        log("🗄️", `  → Yerel DB kaydı REVOKED: clerk_invite_id=${inv.id}`);
      } else {
        log("⚠️", `  → Yerel DB'de clerk_invite_id=${inv.id} kaydı bulunamadı (shadow tablo henüz sync edilmemiş olabilir).`);
      }
    } catch (dbErr) {
      log("❌", `  → Yerel DB güncelleme hatası: ${dbErr.message}`);
    }
  }

  // E-postaya bağlı organizasyonu da temizle (PENDING ise)
  try {
    const orgCleanup = await turso.execute({
      sql: `UPDATE organizations SET status = 'DISABLED' WHERE boss_email = ? AND status = 'PENDING' AND boss_id IS NULL`,
      args: [email],
    });
    if (orgCleanup.rowsAffected > 0) {
      log("🏢", `  → ${orgCleanup.rowsAffected} askıda organizasyon DISABLED olarak güncellendi.`);
    }
  } catch (err) {
    log("⚠️", `  → Organizasyon temizleme uyarısı: ${err.message}`);
  }

  log("🎉", `"${email}" için tüm davet iptalleri tamamlandı.`);
}

// ─── --list MODU ─────────────────────────────────────────────────────────────

async function listInvitations() {
  log("📋", "Yerel Turso veritabanındaki davetiyeler listeleniyor...\n");

  const result = await turso.execute({
    sql: `SELECT i.id, i.clerk_invite_id, i.email, i.organization_id, i.status, i.created_at, i.expires_at, o.name as org_name
          FROM invitations i
          LEFT JOIN organizations o ON i.organization_id = o.id
          ORDER BY i.created_at DESC`,
    args: [],
  });

  if (result.rows.length === 0) {
    log("📭", "Yerel veritabanında kayıtlı davetiye bulunamadı.");
    log("💡", "İpucu: Önce --sync ile Clerk davetiyelerini eşitleyin.");
    return;
  }

  console.log("┌─────────────────────────────────────┬────────────────────────────┬──────────┬────────────────────────────┐");
  console.log("│ E-posta                             │ Organizasyon               │ Durum    │ Clerk ID                   │");
  console.log("├─────────────────────────────────────┼────────────────────────────┼──────────┼────────────────────────────┤");

  for (const row of result.rows) {
    const email = (row.email || "").padEnd(35);
    const orgName = (row.org_name || "N/A").substring(0, 26).padEnd(26);
    const status = (row.status || "").padEnd(8);
    const clerkId = (row.clerk_invite_id || "N/A").substring(0, 26).padEnd(26);
    console.log(`│ ${email} │ ${orgName} │ ${status} │ ${clerkId} │`);
  }

  console.log("└─────────────────────────────────────┴────────────────────────────┴──────────┴────────────────────────────┘");
  log("📊", `Toplam: ${result.rows.length} kayıt.`);
}

// ─── ANA GİRİŞ NOKTASI ──────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║       🎟️  Clerk Invitations Manager CLI                  ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Kullanım:                                               ║
║    --sync              Clerk → Turso eşitleme            ║
║    --revoke <email>    E-posta bazlı davet iptali        ║
║    --list              Yerel DB davetiye listesi         ║
║                                                          ║
║  Örnekler:                                               ║
║    node src/scripts/clerk-invitations-manager.js --sync  ║
║    node src/scripts/clerk-invitations-manager.js \\       ║
║         --revoke ornek@sirket.com                        ║
║    node src/scripts/clerk-invitations-manager.js --list  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`);
    process.exit(0);
  }

  // Ortam değişkenleri kontrolü
  if (!process.env.CLERK_SECRET_KEY) {
    console.error("❌ CLERK_SECRET_KEY ortam değişkeni bulunamadı.");
    process.exit(1);
  }
  if (!process.env.TURSO_DATABASE_URL) {
    console.error("❌ TURSO_DATABASE_URL ortam değişkeni bulunamadı.");
    process.exit(1);
  }

  const command = args[0];

  try {
    switch (command) {
      case "--sync":
        await syncInvitations();
        break;

      case "--revoke": {
        const email = args[1];
        if (!email || !email.includes("@")) {
          console.error("❌ Geçerli bir e-posta adresi belirtin: --revoke ornek@sirket.com");
          process.exit(1);
        }
        await revokeByEmail(email);
        break;
      }

      case "--list":
        await listInvitations();
        break;

      default:
        console.error(`❌ Bilinmeyen komut: ${command}`);
        console.error("   Kullanım: --sync | --revoke <email> | --list");
        process.exit(1);
    }
  } catch (err) {
    console.error("❌ Beklenmeyen hata:", err);
    process.exit(1);
  } finally {
    turso.close();
  }
}

main();
