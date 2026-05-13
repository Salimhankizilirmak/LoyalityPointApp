import { createClerkClient } from '@clerk/backend';
const client = createClerkClient({ secretKey: "test" });
client.organizations.createOrganizationInvitation({
  organizationId: "org_123",
  emailAddress: "test@test.com",
  inviterUserId: "user_123",
  role: "org:member",
  redirectUrl: "http://localhost:3000/dashboard"
});
