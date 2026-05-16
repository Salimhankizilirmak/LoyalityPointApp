import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../../.env.local") });

async function run() {
  const { clerkClient } = await import("@clerk/nextjs/server");
  const email = "novexistech@gmail.com";
  console.log(`Setting super_admin role for ${email}...`);
  
  const client = await clerkClient();
  const users = await client.users.getUserList({ emailAddress: [email] });
  
  if (users.data.length === 0) {
    console.log(`User with email ${email} not found in Clerk.`);
    return;
  }
  
  const user = users.data[0];
  await client.users.updateUserMetadata(user.id, {
    publicMetadata: {
      ...user.publicMetadata,
      role: "super_admin"
    }
  });
  
  console.log(`Successfully updated ${email} to super_admin in Clerk publicMetadata!`);
}

run().catch(console.error);
