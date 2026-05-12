"use server";

import { customerService } from "@/lib/services/customer-service";
import { pointsService } from "@/lib/services/points-service";

export async function inviteCustomerAction(formData: FormData) {
  const data = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    phone: formData.get("phone") as string,
    email: formData.get("email") as string,
  };

  try {
    return await customerService.inviteCustomer(data);
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Bilinmeyen hata") };
  }
}

export async function findCustomerById(clerkId: string) {
  // Keeping this for compatibility, but it could be part of customerService
  try {
    const customers = await customerService.getCustomers();
    return customers.find(c => c.clerkId === clerkId) || null;
  } catch {
    return null;
  }
}

export async function processTransactionAction(customerId: string, amountStr: string, type: "earn" | "spend") {
  const amountTL = parseFloat(amountStr);
  if (isNaN(amountTL) || amountTL <= 0) return { error: "Geçerli bir tutar giriniz." };

  try {
    await pointsService.processTransaction(customerId, amountTL, type);
    return { 
      success: true, 
      message: type === "earn" ? "Puan başarıyla yüklendi!" : "Puan başarıyla harcandı!" 
    };
  } catch (error: unknown) {
    return { error: (error instanceof Error ? error.message : "Bilinmeyen hata") };
  }
}
