import re

file_path = "src/app/(manager)/manager-dashboard/actions.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_action = """
export async function logExportAction(format: "PDF" | "CSV") {
  try {
    const profile = await getManagerProfile();
    if (!profile || !profile.orgId) return { success: false, error: "Organizasyon bulunamadı." };

    const { userId } = await auth();
    if (!userId) return { success: false, error: "Oturum bulunamadı." };
    
    const userLocal = await db.select().from(users).where(eq(users.clerkId, userId)).get();
    const actorName = userLocal ? (userLocal.name || userLocal.email) : "Yönetici";
    const actorRole = userLocal ? userLocal.role : "MANAGER";

    await db.insert(activityLogs).values({
      orgId: profile.orgId,
      type: "system",
      actorName: actorName,
      actorRole: actorRole,
      targetName: "Sistem Logları",
      description: `İşlem Raporu Dışa Aktarıldı (${format})`,
      metadata: JSON.stringify({ format, time: new Date().toISOString() })
    });

    return { success: true };
  } catch (error) {
    console.error("Export log error:", error);
    return { success: false, error: "Log kaydedilemedi" };
  }
}
"""

if "export async function logExportAction" not in content:
    content += new_action

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

