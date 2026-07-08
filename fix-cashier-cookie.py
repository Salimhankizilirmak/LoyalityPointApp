import re

file_path = "src/app/(cashier)/cashier-dashboard/actions.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_code = """    // Eğer çerezdeki veri veritabanındaki gerçek şube ID'si ile uyuşmuyorsa, çerezi strictly güncelle/düzelt
    const cookieStore = await cookies();
    const currentCookieBranchId = cookieStore.get("active_branch_id")?.value;
    if (currentCookieBranchId !== staffProfile.branchId) {
      cookieStore.set("active_branch_id", staffProfile.branchId, { path: "/", httpOnly: true });
    }"""

new_code = """    // Çerez kontrolü: Eğer çerezdeki veri veritabanındaki ile uyuşmuyorsa
    // Server Component aşamasında çerez yazılamaz (Next.js kısıtlaması). 
    // Bunun yerine, veritabanından çekilen staffProfile.branchId "Single Source of Truth" olarak güvenilirdir.
    // İleride çereze ihtiyaç duyulursa Middleware veya Login Route Handler üzerinden set edilmelidir."""

content = content.replace(old_code, new_code)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
