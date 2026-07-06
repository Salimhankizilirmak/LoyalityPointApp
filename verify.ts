import { db } from "./src/db/index";
import { sql, eq } from "drizzle-orm";
import { customers, campaigns, campaignSends, branches, organizations } from "./src/db/schema";
import { loyaltyService } from "./src/lib/services/loyalty-service";
import { campaignService } from "./src/lib/services/campaign-service";
import { randomUUID } from "crypto";

async function main() {
  try {
    console.log("=== 1. Şema: PRAGMA table_info ===");
    const cInfo = await db.run(sql`PRAGMA table_info('customers')`);
    console.log("Customers last_active_at:", cInfo.rows.find((r: any) => r.name === 'last_active_at'));

    const campInfo = await db.run(sql`PRAGMA table_info('campaigns')`);
    console.log("Campaigns inactivity_threshold_days:", campInfo.rows.find((r: any) => r.name === 'inactivity_threshold_days'));

    const sendInfo = await db.run(sql`PRAGMA table_info('campaign_sends')`);
    console.log("Campaign Sends Columns:", sendInfo.rows.map((r: any) => r.name));

    console.log("\n=== 2. lastActiveAt Update ===");
    
    // Find an active branch first
    const branch = await db.select().from(branches).limit(1).get();
    if (!branch) throw new Error("Branch not found in DB");

    // Find or create a customer for this branch's org
    let customer = await db.select().from(customers).where(eq(customers.organizationId, branch.orgId)).limit(1).get();
    if (!customer) {
      const cid = randomUUID();
      await db.insert(customers).values({
        id: cid,
        organizationId: branch.orgId,
        firstName: "Test",
        lastName: "Müşteri",
        phoneNumber: "05554443322",
        globalPoints: 0,
        createdBy: "test",
      });
      customer = await db.select().from(customers).where(eq(customers.id, cid)).get() as any;
    }
    
    console.log("Before: lastActiveAt =", customer.lastActiveAt);

    await loyaltyService.earnPoints({
      cashierId: "test_cashier",
      orgId: customer.organizationId,
      branchId: branch.id,
      customerId: customer.id,
      amountSpent: 100
    });

    const customerAfter = await db.select().from(customers).where(eq(customers.id, customer.id)).get();
    console.log("After: lastActiveAt =", customerAfter?.lastActiveAt);

    console.log("\n=== 3. Kampanya Kuyruk Testi ===");
    // Create a dummy campaign
    const campaignId = randomUUID();
    await db.insert(campaigns).values({
      id: campaignId,
      branchId: branch.id,
      createdBy: "test_cashier",
      name: "Test Pasif Kampanya",
      earnRatio: 5,
      startDate: new Date(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      description: "Test",
    });

    const campaign = await campaignService.getCampaignById(campaignId);
    if (!campaign) throw new Error("Campaign not found");

    console.log("Pasif müşteri bulunabilmesi için müşteri kasıtlı olarak 100 gün öncesine alınıyor...");
    await db.update(customers).set({ lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100) }).where(eq(customers.id, customer.id));

    const inactive = await campaignService.getInactiveCustomers(branch.orgId, campaign.inactivityThresholdDays);
    console.log(`Bulunan pasif müşteri: ${inactive.length}`);
    if(inactive.length > 0) {
      const rows = inactive.map((c: any) => ({
        id: randomUUID(),
        campaignId: campaign.id,
        customerId: c.id,
        status: "pending" as const,
        createdAt: new Date(),
      }));
      await db.insert(campaignSends).values(rows).onConflictDoNothing();
      console.log("Queued:", { success: true, queued: rows.length });
      
      const sends = await db.select().from(campaignSends).where(eq(campaignSends.campaignId, campaign.id));
      console.log("DB'deki Satırlar:", sends.map((s: any) => ({ id: s.id, status: s.status })));
    } 

    console.log("\n=== 4. Cron Execution ===");
    try {
      const { GET } = await import("./src/app/api/cron/process-campaign-sends/route");
      const res = await GET();
      const json = await res.json();
      console.log("Cron Result:", json);
    } catch (e: any) {
      console.log("API Route import error:", e.message);
      console.log("Manuel cron yürütülüyor...");
      const pending = await db.select().from(campaignSends).where(eq(campaignSends.status, "pending")).limit(5);
      const { emailService } = await import("./src/lib/services/email-service");
      let processed = 0;
      for (const send of pending) {
        try {
          await emailService.sendMail({
            to: process.env.SMTP_USER || "test@test.com",
            subject: "Test Kampanya",
            html: "<b>test</b>"
          });
          await db.update(campaignSends).set({ status: "sent", sentAt: new Date() }).where(eq(campaignSends.id, send.id));
          processed++;
        } catch(err: any) {
          await db.update(campaignSends).set({ status: "failed", error: String(err) }).where(eq(campaignSends.id, send.id));
        }
      }
      console.log("Cron Result:", { processed });
    }

    const sendsAfter = await db.select().from(campaignSends).where(eq(campaignSends.campaignId, campaign.id));
    console.log("DB'deki Satırlar (Cron Sonrası):", sendsAfter.map((s: any) => ({ id: s.id, status: s.status, error: s.error })));

  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
main();
