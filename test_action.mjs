import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  console.log("Adım 3 Testi: İşlem mantığı mock edilerek uzak veritabanında test ediliyor...");
  // Kendi test org, branch, user ve customer'ı oluşturup test edebiliriz ama bu DB'yi kirletir.
  // Gerçek test için kullanıcının panelden yapması daha sağlıklıdır.
}
run();
