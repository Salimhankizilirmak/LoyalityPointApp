import { NextResponse } from "next/server";
import { db } from "@/db";
import { campaignSends, campaigns, customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { emailService } from "@/lib/services/email-service";

async function getCustomerById(id: string) {
  return await db.select().from(customers).where(eq(customers.id, id)).get();
}

async function getCampaignById(id: string) {
  return await db.select().from(campaigns).where(eq(campaigns.id, id)).get();
}

function renderCampaignEmail(campaign: any) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #333;">Seni Özledik!</h2>
      <p style="color: #555;">${campaign.name} kampanyamızla seni tekrar aramızda görmek istiyoruz.</p>
      ${campaign.description ? `<p style="color: #555;">${campaign.description}</p>` : ''}
      <p style="color: #555;">Hemen gel, alışverişlerinde daha yüksek oranda (${campaign.earnRatio}x) puan kazan!</p>
    </div>
  `;
}

export async function GET() {
  const pending = await db.select().from(campaignSends)
    .where(eq(campaignSends.status, "pending"))
    .limit(20);

  for (const send of pending) {
    try {
      const customer = await getCustomerById(send.customerId);
      const campaign = await getCampaignById(send.campaignId);

      if (!customer || !campaign) {
        throw new Error("Müşteri veya kampanya bulunamadı");
      }

      // Not: Müşteri tablosunda (customers) email alanı bulunmadığından,
      // test aşamasında mailler sistemin SMTP hesabı olan kendi adresine iletilecektir.
      const targetEmail = process.env.SMTP_USER || "novexistech@gmail.com";

      await emailService.sendMail({
        to: targetEmail,
        subject: campaign.name,
        html: renderCampaignEmail(campaign),
      });

      await db.update(campaignSends)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(campaignSends.id, send.id));
    } catch (e) {
      await db.update(campaignSends)
        .set({ status: "failed", error: String(e) })
        .where(eq(campaignSends.id, send.id));
    }
  }

  return NextResponse.json({ processed: pending.length });
}
