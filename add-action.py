import re

file_path = "src/app/(cashier)/cashier-dashboard/actions.ts"
with open(file_path, "a", encoding="utf-8") as f:
    f.write("""

export async function updateCustomerNameAction(phoneNumber: string, newName: string) {
  try {
    const { orgId } = await resolveCashierContext();
    if (!phoneNumber || !newName || newName.trim().length === 0) {
      return { success: false, error: "Geçersiz veriler." };
    }

    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10) return { success: false, error: "Geçersiz telefon." };
    
    const normalizedPhone = '0' + cleanPhone.slice(-10);

    await db
      .update(customers)
      .set({ name: newName.trim() })
      .where(and(
        eq(customers.organizationId, orgId),
        eq(customers.phoneNumber, normalizedPhone)
      ));

    return { success: true };
  } catch (err) {
    console.error("Müşteri ismi güncellenirken hata:", err);
    return { success: false, error: "İsim güncellenemedi." };
  }
}
""")

