const { createClerkClient } = require('@clerk/backend');
const client = createClerkClient({ secretKey: "test" });
try {
  client.organizations.createOrganizationInvitation({
    organizationId: "org_123",
    emailAddress: "test@test.com",
    inviterUserId: "user_123",
    role: "org:member",
    publicMetadata: { role: "manager" }
  });
  console.log("SUCCESS");
} catch(e) {
  console.error("FAIL", e);
}
