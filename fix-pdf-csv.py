import re

file_path = "src/components/features/manager-dashboard/sections/TransactionsSection.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Helper fonksiyonları komponentin en başına (state tanımlarından sonra) ekleyelim
helpers = """  const [endDate, setEndDate] = useState("");

  const formatExportDate = (rawTime: number) => {
    const d = new Date(rawTime);
    if (isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const sanitizeForPdf = (text: string) => {
    if (!text) return "-";
    return text.replace(/ş/g, "s").replace(/Ş/g, "S")
               .replace(/ğ/g, "g").replace(/Ğ/g, "G")
               .replace(/ü/g, "u").replace(/Ü/g, "U")
               .replace(/ö/g, "o").replace(/Ö/g, "O")
               .replace(/ı/g, "i").replace(/İ/g, "I")
               .replace(/ç/g, "c").replace(/Ç/g, "C");
  };
"""

content = content.replace('  const [endDate, setEndDate] = useState("");', helpers)

# CSV Değişiklikleri
old_csv_logic = """    const headers = ["Müşteri", "Kasiyer", "İşlem Türü", "Saat", "Kazanılan/Harcanan Puan", "Tutar (TL)"];
    const rows = filteredFeed.map(tx => [
      `"${(tx.targetName || "-").replace(/"/g, '""')}"`,
      `"${tx.actorName.replace(/"/g, '""')}"`,
      tx.type,
      tx.time,
      tx.pts || 0,
      tx.amount || 0
    ]);"""

new_csv_logic = """    const headers = ["Müşteri", "İşlem Yapan", "İşlem Türü", "Saat", "Kazanılan/Harcanan Puan", "Tutar (TL)"];
    const rows = filteredFeed.map(tx => [
      `"${(tx.targetName || "-").replace(/"/g, '""')}"`,
      `"${(tx.actorName || "-").replace(/"/g, '""')}"`,
      tx.type,
      formatExportDate(tx.rawTime),
      tx.pts || 0,
      tx.amount || 0
    ]);"""

content = content.replace(old_csv_logic, new_csv_logic)

# PDF Değişiklikleri
old_pdf_logic = """    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Şube İşlem Raporu", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Tarih: ${new Date().toLocaleDateString("tr-TR")}`, 14, 28);
    doc.text(`Toplam İşlem: ${filteredFeed.length}`, 14, 34);

    const tableColumn = ["Hedef / Müşteri", "Aktör", "İşlem Türü", "Tarih"];
    const tableRows = filteredFeed.map(tx => [
      tx.targetName || "-",
      tx.actorName,
      tx.type,
      tx.time
    ]);"""

new_pdf_logic = """    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Sube Islem Raporu", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const today = new Date();
    doc.text(`Tarih: ${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`, 14, 28);
    doc.text(`Toplam Islem: ${filteredFeed.length}`, 14, 34);

    const tableColumn = ["Hedef / Musteri", "Islem Yapan", "Islem Turu", "Tarih"];
    const tableRows = filteredFeed.map(tx => [
      sanitizeForPdf(tx.targetName || "-"),
      sanitizeForPdf(tx.actorName || "-"),
      sanitizeForPdf(tx.type),
      formatExportDate(tx.rawTime)
    ]);"""

content = content.replace(old_pdf_logic, new_pdf_logic)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
