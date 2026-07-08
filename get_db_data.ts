import { db } from "./src/db";
import { loyaltyTransactions } from "./src/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db.select({
     id: loyaltyTransactions.id,
     createdAt: loyaltyTransactions.createdAt,
     rawCreatedAt: sql`created_at`,
  }).from(loyaltyTransactions).limit(5).all();
  
  console.log("DB DATA:", result);
}
main().catch(console.error);
