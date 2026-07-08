import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./index";
import * as fs from "fs";
import { sql } from "drizzle-orm";

async function executeSql() {
  const fileContent = fs.readFileSync("./drizzle/0006_empty_redwing.sql", "utf8");
  // Statement'lar --> statement-breakpoint ile ayrılıyor
  const statements = fileContent.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);
  
  for (const statement of statements) {
    try {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await db.run(sql.raw(statement));
      console.log("Success.");
    } catch (err) {
      console.error(`Error on statement: ${statement}`, err);
    }
  }
  console.log("Done executing SQL.");
}

executeSql();
