"use server";

import { db } from "@/db";
import { organizations, customerRegistrationRequests, registrationAttempts, activityLogs, customers } from "@/db/schema";
import { eq, and, gt, or } from "drizzle-orm";
import { createClerkClient } from "@clerk/backend";
import { headers } from "next/headers";
import { createId } from "@paralleldrive/cuid2";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Telefon numarasını normalize etme (Mevcut mantıkla aynı)
function normalizePhoneToUsername(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  let clean = digits;
  if (clean.startsWith("90")) clean = clean.slice(2);
  else if (clean.startsWith("0")) clean = clean.slice(1);
  return `+90${clean}`;
}

export async function submitCustomerRegistration(
  registrationCode: string,
  data: { name: string; email: string; phone: string; password: string }
) {
  try {
    // 1. Organizasyonu bul
    const org = await db.select().from(organizations).where(eq(organizations.registrationCode, registrationCode)).get();
    if (!org) {
      return { error: "Geçersiz kayıt kodu." };
    }

    // 2. IP al ve Rate Limit kontrolü (Son 1 saat içinde 5 istekten fazla varsa engelle vs. Ama şimdilik basit limit: son 1 saatte 3 deneme)
    const reqHeaders = await headers();
    const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const attempts = await db.select().from(registrationAttempts)
      .where(and(
        eq(registrationAttempts.ip, ip),
        eq(registrationAttempts.orgId, org.id),
        gt(registrationAttempts.createdAt, oneHourAgo)
      )).all();

    if (attempts.length >= 5) {
      return { error: "Çok fazla kayıt denemesi yaptınız. Lütfen daha sonra tekrar deneyin." };
    }

    // 3. Denemeyi kaydet
    await db.insert(registrationAttempts).values({ ip, orgId: org.id });

    const normalizedPhone = normalizePhoneToUsername(data.phone);

    // 4. Duplicate kontrolü (customers VE PENDING_APPROVAL istekler)
    // a) customers tablosu (Telefon veya Email)
    const existingCustomer = await db.select().from(customers)
      .where(and(
        eq(customers.organizationId, org.id),
        eq(customers.phoneNumber, normalizedPhone)
      )).get();
      
    if (existingCustomer) {
      return { error: "Bu telefon numarası ile zaten kayıtlı bir müşteri bulunuyor." };
    }

    // b) customer_registration_requests tablosu (status=PENDING_APPROVAL)
    const pendingRequest = await db.select().from(customerRegistrationRequests)
      .where(and(
        eq(customerRegistrationRequests.orgId, org.id),
        eq(customerRegistrationRequests.status, "PENDING_APPROVAL"),
        or(
          eq(customerRegistrationRequests.phone, normalizedPhone),
          eq(customerRegistrationRequests.email, data.email)
        )
      )).get();

    if (pendingRequest) {
      return { error: "Sistemde halihazırda onay bekleyen bir kaydınız bulunmaktadır." };
    }

    // 5. Clerk kullanıcısı oluştur
    let clerkUser;
    try {
      clerkUser = await clerkClient.users.createUser({
        emailAddress: [data.email],
        password: data.password,
        firstName: data.name,
        publicMetadata: {
          role: "customer",
          orgId: org.id,
        },
      });
    } catch (err: any) {
      console.error("Clerk Create User Error:", err);
      if (err.errors?.[0]?.code === "form_identifier_exists") {
        return { error: "Bu e-posta adresiyle zaten bir hesap mevcut." };
      }
      return { error: "Kullanıcı hesabı oluşturulamadı. Lütfen bilgilerinizi kontrol edin." };
    }

    // 6. customer_registration_requests'e insert
    const requestId = createId();
    await db.insert(customerRegistrationRequests).values({
      id: requestId,
      orgId: org.id,
      name: data.name,
      email: data.email,
      phone: normalizedPhone,
      clerkUserId: clerkUser.id,
      status: "PENDING_APPROVAL",
    });

    // 7. activity_logs'a insert
    await db.insert(activityLogs).values({
      orgId: org.id,
      type: "QR_REGISTRATION_REQUESTED",
      targetName: data.name,
      actorRole: "CUSTOMER",
      description: `${data.name} QR ile kayıt talebinde bulundu`,
    });

    return { success: true };

  } catch (err: any) {
    console.error("Registration submit error:", err);
    return { error: "İşlem sırasında bir hata oluştu." };
  }
}
