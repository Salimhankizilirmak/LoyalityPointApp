import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  const cSends = await client.execute("PRAGMA table_info(campaign_sends)");
  console.log("=== campaign_sends ===");
  console.log(cSends.rows);

  const camps = await client.execute("PRAGMA table_info(campaigns)");
  console.log("\n=== campaigns ===");
  console.log(camps.rows.find(r => r.name === 'inactivity_threshold_days'));

  const custs = await client.execute("PRAGMA table_info(customers)");
  console.log("\n=== customers ===");
  console.log(custs.rows.find(r => r.name === 'last_active_at'));
}
run();
