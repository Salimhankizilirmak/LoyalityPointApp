import re

file_path = "src/app/(manager)/manager-dashboard/campaign-actions.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Import activityLogs
content = content.replace(
    'import { users, branches, campaigns, campaignSends } from "@/db/schema";',
    'import { users, branches, campaigns, campaignSends, activityLogs } from "@/db/schema";'
)

# 2. Update resolveManagerContext
old_context = """  const cookieStore = await cookies();
  const branchId = cookieStore.get("active_branch_id")?.value;
  if (!branchId) throw new Error("Aktif şube bağlamı bulunamadı.");

  return { dbUser, branchId };"""

new_context = """  const cookieStore = await cookies();
  const branchId = cookieStore.get("active_branch_id")?.value;
  if (!branchId) throw new Error("Aktif şube bağlamı bulunamadı.");

  const branchObj = await db.select({ orgId: branches.orgId }).from(branches).where(eq(branches.id, branchId)).get();
  if (!branchObj) throw new Error("Şube veritabanında bulunamadı.");

  return { dbUser, branchId, orgId: branchObj.orgId };"""
content = content.replace(old_context, new_context)

# 3. createCampaignAction
old_create = """    const campaign = await campaignService.createCampaign({
      branchId,
      createdBy: dbUser.id,
      name: data.name.trim(),
      campaignType: data.campaignType,
      earnRatio: data.earnRatio,
      tiers: data.tiers,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      description: data.description?.trim(),
    });

    return { success: true, campaign };"""

new_create = """    const { orgId } = await resolveManagerContext(); // Re-calling just to show logic, but we already have orgId
    const campaign = await campaignService.createCampaign({
      branchId,
      createdBy: dbUser.id,
      name: data.name.trim(),
      campaignType: data.campaignType,
      earnRatio: data.earnRatio,
      tiers: data.tiers,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      description: data.description?.trim(),
    });

    await db.insert(activityLogs).values({
      orgId,
      type: "system",
      actorName: dbUser.name || dbUser.email,
      actorRole: dbUser.role,
      targetName: `Kampanya: ${data.name.trim()}`,
      description: `Yeni kampanya oluşturuldu. Tip: ${data.campaignType}, Kazanım: ${data.campaignType === "multiplier" ? "%" + data.earnRatio : "Kademeli Limite Göre"}`,
      metadata: JSON.stringify(data)
    });

    return { success: true, campaign };"""
# Fix the re-calling issue by destructing properly in createCampaignAction
content = content.replace("const { dbUser, branchId } = await resolveManagerContext();", "const { dbUser, branchId, orgId } = await resolveManagerContext();")
content = content.replace("""    const campaign = await campaignService.createCampaign({
      branchId,
      createdBy: dbUser.id,
      name: data.name.trim(),
      campaignType: data.campaignType,
      earnRatio: data.earnRatio,
      tiers: data.tiers,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      description: data.description?.trim(),
    });

    return { success: true, campaign };""", """    const campaign = await campaignService.createCampaign({
      branchId,
      createdBy: dbUser.id,
      name: data.name.trim(),
      campaignType: data.campaignType,
      earnRatio: data.earnRatio,
      tiers: data.tiers,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      description: data.description?.trim(),
    });

    await db.insert(activityLogs).values({
      orgId,
      type: "system",
      actorName: dbUser.name || dbUser.email,
      actorRole: dbUser.role,
      targetName: `Kampanya: ${data.name.trim()}`,
      description: `Yeni kampanya oluşturuldu. Tip: ${data.campaignType}, Kazanım: ${data.campaignType === "multiplier" ? "%" + data.earnRatio : "Kademeli Limite Göre"}`,
      metadata: JSON.stringify(data)
    });

    return { success: true, campaign };""")

# 4. deactivateCampaignAction
content = content.replace("const { branchId } = await resolveManagerContext();", "const { branchId, dbUser, orgId } = await resolveManagerContext();")
content = content.replace("""    await campaignService.deactivateCampaign(campaignId, branchId);
    return { success: true };""", """    await campaignService.deactivateCampaign(campaignId, branchId);
    await db.insert(activityLogs).values({
      orgId,
      type: "system",
      actorName: dbUser.name || dbUser.email,
      actorRole: dbUser.role,
      targetName: `Kampanya ID: ${campaignId.slice(-6)}`,
      description: `Kampanya manuel olarak sonlandırıldı/deaktif edildi.`
    });
    return { success: true };""")

# 5. updateCampaignDatesAction
content = content.replace("""    const updated = await campaignService.updateCampaignDates(
      campaignId,
      branchId,
      new Date(startDate),
      new Date(endDate)
    );
    return { success: true, campaign: updated };""", """    const updated = await campaignService.updateCampaignDates(
      campaignId,
      branchId,
      new Date(startDate),
      new Date(endDate)
    );
    await db.insert(activityLogs).values({
      orgId,
      type: "system",
      actorName: dbUser.name || dbUser.email,
      actorRole: dbUser.role,
      targetName: `Kampanya: ${updated.name}`,
      description: `Kampanya tarihleri güncellendi. Yeni Başlangıç: ${new Date(startDate).toLocaleDateString('tr-TR')}, Yeni Bitiş: ${new Date(endDate).toLocaleDateString('tr-TR')}`
    });
    return { success: true, campaign: updated };""")

# 6. updateCampaignDetailsAction
content = content.replace("""    const updated = await campaignService.updateCampaignDetails(campaignId, branchId, payload);
    return { success: true, campaign: updated };""", """    const updated = await campaignService.updateCampaignDetails(campaignId, branchId, payload);
    await db.insert(activityLogs).values({
      orgId,
      type: "system",
      actorName: dbUser.name || dbUser.email,
      actorRole: dbUser.role,
      targetName: `Kampanya: ${updated.name}`,
      description: `Kampanya detayları (isim, tip, oran/limit vb.) güncellendi.`,
      metadata: JSON.stringify(payload)
    });
    return { success: true, campaign: updated };""")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
