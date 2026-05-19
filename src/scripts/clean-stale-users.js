const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const url = process.env.TURSO_DATABASE_URL || "";
const authToken = process.env.TURSO_AUTH_TOKEN || "";
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!url || !authToken) {
  console.error("Database URL or Auth Token not found in .env.local");
  process.exit(1);
}

const finalUrl = url.startsWith("libsql://") 
  ? url.replace("libsql://", "https://") 
  : url;

const client = createClient({
  url: finalUrl,
  authToken: authToken,
});

async function main() {
  console.log("🔍 Scanning Turso database for stale BOSS users...");
  
  // 1. Get all BOSS users from database
  const res = await client.execute("SELECT * FROM users WHERE role = 'BOSS'");
  const bossUsers = res.rows;
  
  console.log(`Found ${bossUsers.length} BOSS users in local database.`);

  let deletedCount = 0;

  for (const user of bossUsers) {
    const clerkId = user.clerk_id || user.clerkId;
    const email = user.email;
    
    if (!clerkId) {
      console.warn(`⚠️ User with email ${email} has no clerk_id, skipping check.`);
      continue;
    }

    console.log(`Checking user: ${email} (Clerk ID: ${clerkId})`);

    // 2. Fetch from Clerk API
    try {
      const response = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        console.warn(`🚨 User ${email} (${clerkId}) NOT found on Clerk! This is a stale/hayalet user.`);
        
        // Delete from database
        console.log(`🧹 Deleting stale user ${email} from local database...`);
        await client.execute({
          sql: "DELETE FROM users WHERE clerk_id = ?",
          args: [clerkId]
        });
        console.log(`✅ Stale user ${email} successfully deleted.`);
        deletedCount++;
      } else if (response.ok) {
        console.log(`✅ User ${email} is valid on Clerk.`);
      } else {
        const errText = await response.text();
        console.error(`⚠️ Clerk API returned status ${response.status}: ${errText}`);
      }
    } catch (err) {
      console.error(`❌ Error checking user ${email} against Clerk:`, err);
    }
  }

  console.log(`\n🎉 Scan and self-healing cleanup complete! Purged ${deletedCount} stale users.`);
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
