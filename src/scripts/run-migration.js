const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

const url = process.env.TURSO_DATABASE_URL?.trim() || "";
const authToken = process.env.TURSO_AUTH_TOKEN?.trim() || "";

const finalUrl = url.startsWith("libsql://") 
  ? url.replace("libsql://", "https://") 
  : url;

console.log("Connecting to:", finalUrl);

const client = createClient({
  url: finalUrl,
  authToken: authToken,
});

async function main() {
  try {
    console.log("Running migration queries...");
    
    // Username kolonunu ekle
    await client.execute("ALTER TABLE users ADD COLUMN username TEXT;");
    console.log("Column 'username' added successfully.");

    // Unique index oluştur
    await client.execute("CREATE UNIQUE INDEX users_username_unique ON users (username);");
    console.log("Unique index on 'username' created successfully.");
    
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    client.close();
  }
}

main();
