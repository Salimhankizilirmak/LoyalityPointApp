import { clerkClient } from "@clerk/nextjs/server";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function run() {
  const emailArg = process.argv[2];
  if (!emailArg) {
    console.error("❌ Lütfen simüle edilecek patron e-posta adresini belirtin.");
    console.log("👉 Örnek: npx tsx src/scripts/mock-webhook.ts patron@sirket.com");
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  console.log(`🚀 [MockWebhook] Simüle ediliyor. E-posta: ${email}`);

  if (!process.env.CLERK_SECRET_KEY) {
    console.error("❌ CLERK_SECRET_KEY bulunamadı. Lütfen .env.local dosyasını kontrol edin.");
    process.exit(1);
  }

  try {
    const client = await clerkClient();
    console.log("🔍 [MockWebhook] Clerk üzerinde kullanıcı aranıyor...");
    const clerkUsers = await client.users.getUserList({ emailAddress: [email] });

    if (clerkUsers.data.length === 0) {
      console.error(`❌ Clerk üzerinde '${email}' adresine sahip bir kullanıcı bulunamadı.`);
      console.log("💡 İpucu: Kullanıcının daveti kabul edip Clerk üzerinden kaydını tamamladığından emin olun.");
      process.exit(1);
    }

    const targetUser = clerkUsers.data[0];
    const clerkId = targetUser.id;
    console.log(`✅ [MockWebhook] Kullanıcı bulundu: ClerkId=${clerkId}`);

    // Webhook yükünü (payload) hazırlıyoruz
    const webhookPayload = {
      type: "user.created",
      data: {
        id: clerkId,
        email_addresses: [
          {
            email_address: email,
          },
        ],
        public_metadata: {
          role: "boss",
        },
      },
    };

    console.log("📤 [MockWebhook] Webhook endpoint'ine (/api/webhooks/clerk) istek gönderiliyor...");
    
    const host = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${host}/api/webhooks/clerk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    const resText = await response.text();
    if (response.ok) {
      console.log("🎉 [MockWebhook] Webhook başarıyla tetiklendi ve işlendi!");
      console.log(`📥 Cevap: ${resText}`);
    } else {
      console.error(`❌ [MockWebhook] Webhook tetikleme başarısız. Status: ${response.status}`);
      console.error(`📥 Hata Detayı: ${resText}`);
    }

  } catch (error) {
    console.error("❌ [MockWebhook] Bir hata oluştu:", error);
    process.exit(1);
  }
}

run();
