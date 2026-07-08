import re

file_path = "src/components/features/manager-dashboard/hooks/useManagerDashboard.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# removeMember importunu bul ve sil (veya yanina ekle)
content = content.replace("removeMember,", "")

# yeni action importu ekle
new_import = 'import { deleteStaffMemberAction } from "@/app/actions/staff-management";\n'
content = new_import + content

# handleRemoveCashier icini guncelle
old_code = """  const handleRemoveCashier = async (id: string) => {
    if (!confirm("Bu kasiyeri silmek istediğinize emin misiniz?")) return;
    setLoadingId(id);
    try {
      await removeMember(id);
      await refreshData();
    } catch (err) {
      console.error(err);
      setError("Kasiyer kaydı silinemedi.");
    } finally {
      setLoadingId(null);
    }
  };"""

new_code = """  const handleRemoveCashier = async (id: string) => {
    if (!confirm("Bu kasiyeri sistemden ve organizasyondan kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) return;
    setLoadingId(id);
    try {
      // id parametresi 'inv-' ile basliyorsa bu bir davettir, henuz db user degildir.
      // Eger id normal string ise deleteStaffMemberAction cagiriyoruz.
      if (id.startsWith("inv-")) {
          // Daveti sil
          // Henuz davet silme fonksiyonu burada yok, normal removeMember bunu davet silme icin de yapmis olabilir.
          // O yuzden mevcut removeMember'i importtan silmesek mi? 
          // Hayir db.users.id bekliyor. Biz ikisini de calistiralim.
      }
      
      const res = await deleteStaffMemberAction(id, "CASHIER");
      if (res && res.error) {
        setError(res.error);
      } else {
        await refreshData();
      }
    } catch (err) {
      console.error(err);
      setError("Kasiyer kaydı silinemedi.");
    } finally {
      setLoadingId(null);
    }
  };"""

# Once id.startsWith("inv-") mantigi eklenecegi icin import u tam duzeltmeliyiz.
