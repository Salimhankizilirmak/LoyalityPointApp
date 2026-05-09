import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  // Süper Admin Kontrolü
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  
  const envEmails = process.env.SUPER_ADMIN_EMAILS || "";
  const allowedEmails = envEmails.split(",").map(e => e.trim().toLowerCase());

  if (!allowedEmails.includes(email)) {
    // Süper admin değilse genel dashboard'a yolla (oradan da yetkisine göre paneline düşer)
    redirect("/dashboard");
  }

  return <>{children}</>;
}
