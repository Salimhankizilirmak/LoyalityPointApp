require('dotenv').config({ path: '.env.local' });
const { createClerkClient } = require('@clerk/backend');
const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
async function run() {
  const invs = await client.invitations.getInvitationList({ status: "revoked" });
  if (invs.data.length > 0) {
    console.log("Revoked invite ID:", invs.data[0].id);
    try {
      if (client.invitations.deleteInvitation) {
        await client.invitations.deleteInvitation(invs.data[0].id);
        console.log("Deleted!");
      } else {
        console.log("deleteInvitation method does not exist.");
      }
    } catch(e) {
      console.log("Error deleting:", e.message);
    }
  } else {
    console.log("No revoked invites.");
  }
}
run();
