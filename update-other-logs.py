import re

file_path = "src/app/(manager)/manager-dashboard/actions.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update toggleStaffStatus
old_toggle = """    await db.update(staffProfiles)
      .set({ isActive: !currentActive })
      .where(eq(staffProfiles.userId, memberId));

    return { success: true };"""

new_toggle = """    await db.update(staffProfiles)
      .set({ isActive: !currentActive })
      .where(eq(staffProfiles.userId, memberId));

    const profile = await getManagerProfile();
    if (profile?.orgId) {
      await db.insert(activityLogs).values({
        orgId: profile.orgId,
        type: "system",
        actorName: dbUserLocal.name || dbUserLocal.email || "Yönetici",
        actorRole: dbUserLocal.role,
        targetName: `Personel ID: ${memberId.slice(-6)}`,
        description: `Personel durumu ${!currentActive ? 'Aktif' : 'Pasif'} olarak güncellendi.`
      });
    }

    return { success: true };"""

content = content.replace(old_toggle, new_toggle)

# 2. Update updateStoreSettingsAction
old_settings = """export async function updateStoreSettingsAction(pointsEquivalent: number, tlEquivalent: number) {
  try {
    const { managerService } = await import("@/lib/services/manager-service");
    return await managerService.updateStoreSettings(pointsEquivalent, tlEquivalent);
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Ayarlar güncellenirken bir hata oluştu.") };
  }
}"""

new_settings = """export async function updateStoreSettingsAction(pointsEquivalent: number, tlEquivalent: number) {
  try {
    const { managerService } = await import("@/lib/services/manager-service");
    const res = await managerService.updateStoreSettings(pointsEquivalent, tlEquivalent);
    
    const profile = await getManagerProfile();
    const clerkUser = await auth();
    if (profile?.orgId && clerkUser.userId) {
      const userLocal = await db.select().from(users).where(eq(users.clerkId, clerkUser.userId)).get();
      if (userLocal) {
        await db.insert(activityLogs).values({
          orgId: profile.orgId,
          type: "system",
          actorName: userLocal.name || userLocal.email || "Yönetici",
          actorRole: userLocal.role,
          targetName: "Mağaza Ayarları",
          description: `Puan/TL Dönüşüm ayarları güncellendi. Yeni Değer: ${pointsEquivalent} Puan = ${tlEquivalent} TL`
        });
      }
    }
    
    return res;
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Ayarlar güncellenirken bir hata oluştu.") };
  }
}"""

content = content.replace(old_settings, new_settings)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
