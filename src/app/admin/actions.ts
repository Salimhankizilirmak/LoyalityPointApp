"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createOrganizationAction(formData: FormData) {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    return { error: "Yetkisiz erişim." };
  }

  const role = (sessionClaims?.metadata as any)?.role;
  if (role !== "superadmin") {
    return { error: "Bu işlem için Süper Admin yetkisi gereklidir." };
  }

  const name = formData.get("name") as string;
  if (!name || name.trim() === "") {
    return { error: "Firma adı zorunludur." };
  }

  try {
    const client = await clerkClient();
    const org = await client.organizations.createOrganization({
      name,
      createdBy: userId,
    });
    
    revalidatePath("/sys-core-admin-7f9a2b8c");
    return { success: true, message: `Firma '${org.name}' başarıyla oluşturuldu!` };
  } catch (error: any) {
    console.error("Org creation error:", error);
    return { error: error.message || "Firma oluşturulurken bir hata oluştu." };
  }
}
