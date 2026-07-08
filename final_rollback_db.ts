import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  const tables = [
    "users", "staff_profiles", "organizations", "branches", "user_branches", 
    "customers", "loyalty_transactions", "campaigns", "customer_campaigns",
    "loyalty_programs", "points_history", "invitations"
  ];
  
  for (const table of tables) {
    try {
      await db.run(sql.raw(`UPDATE ${table} SET created_at = created_at / 1000 WHERE created_at > 1000000000000`));
      console.log(`Rollback created_at for ${table}`);
    } catch (err) {}
    try {
      await db.run(sql.raw(`UPDATE ${table} SET updated_at = updated_at / 1000 WHERE updated_at > 1000000000000`));
    } catch (err) {}
  }
  console.log("DB Rollback Complete.");
}
main().catch(console.error);
