require('dotenv').config({ path: '.env.local' });
const { createClerkClient } = require('@clerk/backend');

const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function run() {
  const email = "test-revoke-123@example.com";
  try {
    console.log("1. Creating invite...");
    const inv1 = await client.invitations.createInvitation({ emailAddress: email });
    console.log("Created:", inv1.id);

    console.log("2. Revoking invite...");
    await client.invitations.revokeInvitation(inv1.id);
    console.log("Revoked:", inv1.id);

    console.log("3. Creating new invite for same email...");
    const inv2 = await client.invitations.createInvitation({ emailAddress: email });
    console.log("Created new:", inv2.id);

  } catch (e) {
    console.error("Error:", JSON.stringify(e.errors, null, 2));
  }
}
run();
