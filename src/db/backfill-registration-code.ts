import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./index";
import { organizations } from "./schema";
import { eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

async function backfill() {
  console.log("Backfill started...");
  try {
    const orgs = await db.select().from(organizations).where(isNull(organizations.registrationCode));
    console.log(`Found ${orgs.length} organizations without a registration code.`);

    for (const org of orgs) {
      const code = nanoid(10);
      await db.update(organizations).set({ registrationCode: code }).where(eq(organizations.id, org.id));
      console.log(`Updated organization ${org.name} (${org.id}) with code: ${code}`);
    }
    
    console.log("Backfill completed successfully.");
  } catch (err) {
    console.error("Backfill failed:", err);
  }
}

backfill();
