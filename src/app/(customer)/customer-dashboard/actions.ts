"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, customers, loyaltyTransactions, branches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { customerService } from "@/lib/services/customer-service";

export async function syncCustomerData() {
  try {
    const { sessionClaims } = await auth();
    const metadata = (sessionClaims?.metadata || {}) as Record<string, unknown>;
    console.log(`[Sync] syncCustomerData initiated with metadata:`, metadata);
    return await customerService.syncCustomerData();
  } catch (error: unknown) {
    console.error("Sync error:", error);
    return null;
  }
}

/**
 * Müşterinin kullanıcı adını Clerk ve Turso DB üzerinde günceller.
 */
export async function saveCustomerUsernameAction(prevState: unknown, formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Yetkisiz işlem. Oturum bulunamadı." };
  }

  const usernameInput = formData.get("username") as string;
  if (!usernameInput || usernameInput.trim() === "") {
    return { success: false, error: "Kullanıcı adı boş bırakılamaz." };
  }

  const username = usernameInput.trim().toLowerCase();

  // Regex doğrulama: Sadece küçük harf, rakam, alt çizgi ve nokta. En az 3, en fazla 30 karakter.
  const usernameRegex = /^[a-z0-9_.]+$/;
  if (!usernameRegex.test(username)) {
    return { success: false, error: "Kullanıcı adı sadece küçük harf, rakam, alt çizgi (_) ve nokta (.) içerebilir." };
  }

  if (username.length < 3 || username.length > 30) {
    return { success: false, error: "Kullanıcı adı 3 ile 30 karakter arasında olmalıdır." };
  }

  try {
    const client = await clerkClient();

    // 1. Clerk üzerinde kullanıcıyı güncelle (Primary Source)
    try {
      await client.users.updateUser(userId, {
        username: username,
      });
      console.log(`[SetupUsernameCustomer] 🏆 Clerk username updated successfully for ${userId}`);
    } catch (clerkErr) {
      console.error(`[SetupUsernameCustomer] ❌ Clerk username update failed:`, clerkErr);
      
      const clerkErrObj = clerkErr as { status?: number; errors?: Array<{ code?: string; message?: string }> };
      const errCode = clerkErrObj.errors?.[0]?.code || "";
      const errMsg = clerkErrObj.errors?.[0]?.message || "";
      
      if (errCode === "form_identifier_exists" || errMsg.includes("exists") || errMsg.includes("taken") || clerkErrObj.status === 422) {
        return { 
          success: false, 
          error: "Bu kullanıcı adı alınmıştır, başka bir ad deneyin." 
        };
      }
      
      return { 
        success: false, 
        error: "İşlem sırasında sistemsel bir hata oluştu. Lütfen yöneticinizle iletişime geçin." 
      };
    }

    // 2. Turso Veritabanını güncelle
    try {
      await db.update(users)
        .set({ username })
        .where(eq(users.clerkId, userId));
      console.log(`[SetupUsernameCustomer] 🗄️ Turso DB users table updated successfully for clerkId: ${userId}`);
    } catch (dbErr) {
      console.error(`[SetupUsernameCustomer] ❌ Turso DB update failed:`, dbErr);
      return { success: false, error: "İşlem sırasında sistemsel bir hata oluştu. Lütfen yöneticinizle iletişime geçin." };
    }

    // 3. Cache temizle ve yönlendir
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/customer-dashboard");
    revalidatePath("/customer-dashboard", "layout");

    return { success: true, error: "" };
  } catch (err) {
    console.error(`[SetupUsernameCustomer] ❌ Global setup error:`, err);
    return { success: false, error: "İşlem sırasında sistemsel bir hata oluştu. Lütfen yöneticinizle iletişime geçin." };
  }
}

/**
 * Müşterinin sadakat hareketlerini (BURN, CASH_SETTLEMENT, EARN, VOID) kronolojik ve gruplanmış olarak getirir.
 */
export async function getCustomerLedgerTransactionsAction() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return { success: false, error: "Oturum bulunamadı.", transactions: [] };
    }

    const metadata = (sessionClaims?.metadata || {}) as Record<string, unknown>;
    const orgId = metadata.orgId as string;

    console.log(`[Ledger] Fetching transactions for user ${userId} in org ${orgId}`);

    // 1. Clerk kullanıcısını al
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    
    // Telefon numarası ve e-postasını belirle
    const phoneFromMeta = (clerkUser.publicMetadata?.phone as string) || "";
    let primaryPhone = clerkUser.phoneNumbers?.[0]?.phoneNumber || phoneFromMeta;
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";

    // Telefon numarasını okurken fallback zincirini güçlendir, sunucu servisine asla boş string gönderme.
    if (!primaryPhone || primaryPhone.trim() === "") {
      const emailStr = email || clerkUser.id;
      let hash = 0;
      for (let i = 0; i < emailStr.length; i++) {
        hash = emailStr.charCodeAt(i) + ((hash << 5) - hash);
      }
      const num = Math.abs(hash).toString().substring(0, 10).padEnd(10, "0");
      primaryPhone = `+90${num}`;
      console.log(`[Ledger] Fallback phone generated: ${primaryPhone} for user: ${userId}`);
    }

    // 2. Customers tablosunda telefon veya e-posta ile eşleşen customer kaydını bul
    let customerRecord = null;
    if (primaryPhone) {
      const cleanPhone = primaryPhone.replace(/[\s+-]/g, "");
      
      customerRecord = await db.select()
        .from(customers)
        .where(eq(customers.phoneNumber, primaryPhone))
        .get();
      
      if (!customerRecord && cleanPhone) {
        const allCustomers = await db.select().from(customers).all();
        customerRecord = allCustomers.find(c => {
          const cClean = c.phoneNumber.replace(/[\s+-]/g, "");
          return cClean === cleanPhone || cClean.endsWith(cleanPhone) || cleanPhone.endsWith(cClean);
        }) || null;
      }
    }

    if (!customerRecord) {
      console.warn(`[Ledger] Müşteri eşleşme verisi eksik for user: ${userId}. Customer record not found in DB. Phone: ${primaryPhone}, Email: ${email}`);
      return { success: true, transactions: [] };
    }

    // 3. Müşteriye ait tüm loyaltyTransactions kayıtlarını çek
    const rawTxs = await db.select({
      id: loyaltyTransactions.id,
      type: loyaltyTransactions.type,
      amountSpent: loyaltyTransactions.amountSpent,
      pointsAmount: loyaltyTransactions.pointsAmount,
      description: loyaltyTransactions.description,
      status: loyaltyTransactions.status,
      createdAt: loyaltyTransactions.createdAt,
      branchName: branches.name,
    })
    .from(loyaltyTransactions)
    .leftJoin(branches, eq(loyaltyTransactions.branchId, branches.id))
    .where(eq(loyaltyTransactions.customerId, customerRecord.id))
    .orderBy(desc(loyaltyTransactions.createdAt))
    .all();

    // 4. Europe/Istanbul timezone formatlayıcı
    const formatter = new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      dateStyle: "short",
      timeStyle: "short",
    });

    // 5. Referans bazlı gruplama (BURN + CASH_SETTLEMENT)
    // Map ile işlemleri gruplayalım
    interface ProcessedTx {
      id: string;
      refId: string | null;
      type: "EARN" | "BURN" | "VOID" | "CASH_SETTLEMENT" | "SPLIT_PAYMENT";
      amountSpent: number; // TL cinsinden
      pointsAmount: number; // Harcanan/kazanılan puan
      totalCartAmount: number; // Toplam sepet tutarı
      description: string;
      status: "SUCCESS" | "VOIDED";
      createdAtFormatted: string;
      createdAt: Date;
      branchName: string;
    }

    const groups: { [refId: string]: typeof rawTxs } = {};
    const singleTxs: typeof rawTxs = [];

    rawTxs.forEach((tx) => {
      const refMatch = tx.description?.match(/REF-[A-Z0-9]{6}/);
      if (refMatch) {
        const refId = refMatch[0];
        if (!groups[refId]) {
          groups[refId] = [];
        }
        groups[refId].push(tx);
      } else {
        singleTxs.push(tx);
      }
    });

    const processedTxs: ProcessedTx[] = [];

    // Gruplanmış Split Payment (BURN + CASH_SETTLEMENT) işlemleri oluştur
    Object.entries(groups).forEach(([refId, txList]) => {
      // Bir gruptaki işlemlerden en eski veya en yeni olanın tarihini baz alalım
      const mainTx = txList[0];
      
      const burnTx = txList.find(t => t.type === "BURN");
      const settlementTx = txList.find(t => t.type === "CASH_SETTLEMENT");
      const voidTx = txList.find(t => t.type === "VOID" || t.status === "VOIDED");

      const isVoided = voidTx !== undefined || txList.some(t => t.status === "VOIDED");

      const pointsBurned = burnTx ? Math.abs(burnTx.pointsAmount) : 0;
      const cashPaid = settlementTx ? (settlementTx.amountSpent || 0) / 100 : 0;
      const totalCartAmount = pointsBurned + cashPaid;

      processedTxs.push({
        id: mainTx.id,
        refId,
        type: "SPLIT_PAYMENT",
        amountSpent: cashPaid,
        pointsAmount: pointsBurned,
        totalCartAmount,
        description: `${refId} referanslı parçalı ödeme işlemi.`,
        status: isVoided ? "VOIDED" : "SUCCESS",
        createdAtFormatted: formatter.format(mainTx.createdAt),
        createdAt: mainTx.createdAt,
        branchName: mainTx.branchName || "Bilinmeyen Şube",
      });
    });

    // Gruplanmamış tekil işlemleri ekle (Örn: EARN)
    singleTxs.forEach((tx) => {
      const isVoided = tx.status === "VOIDED" || tx.type === "VOID";
      
      let amountSpent = 0;
      let pointsAmount = 0;
      let totalCartAmount = 0;

      if (tx.type === "EARN") {
        amountSpent = (tx.amountSpent || 0) / 100;
        pointsAmount = tx.pointsAmount;
        totalCartAmount = amountSpent; // EARN işleminde toplam harcama tutarı amountSpent'tir
      } else {
        amountSpent = (tx.amountSpent || 0) / 100;
        pointsAmount = Math.abs(tx.pointsAmount);
        totalCartAmount = amountSpent;
      }

      processedTxs.push({
        id: tx.id,
        refId: null,
        type: tx.type,
        amountSpent,
        pointsAmount,
        totalCartAmount,
        description: tx.description || "",
        status: isVoided ? "VOIDED" : "SUCCESS",
        createdAtFormatted: formatter.format(tx.createdAt),
        createdAt: tx.createdAt,
        branchName: tx.branchName || "Bilinmeyen Şube",
      });
    });

    // Yeniden kronolojik olarak sırala
    processedTxs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return { success: true, transactions: processedTxs };
  } catch (error: unknown) {
    console.error("[getCustomerLedgerTransactionsAction] Error:", error);
    return { success: false, error: "İşlemler listelenirken bir hata oluştu.", transactions: [] };
  }
}

