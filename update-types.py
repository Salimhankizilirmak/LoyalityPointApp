import re

file_path = "src/components/features/manager-dashboard/types.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_activity_item = """export interface ActivityItem {
  id: string;
  type: ActivityType;
  actorName: string;     // Kasiyer adı (puan işlemleri) veya davet edilen kişi adı
  targetName?: string;   // Müşteri adı (earned/spent için)
  pts?: number;
  amount?: number;
  time: string;
  rawTime: number;       // Unix ms — sıralama için
  status?: string;
  originalTx?: Transaction; // Düzenleme butonu için
}"""

new_activity_item = """export interface ActivityItem {
  id: string;
  type: ActivityType;
  actorName: string;     // Kasiyer adı (puan işlemleri) veya davet edilen kişi adı
  targetName?: string;   // Müşteri adı (earned/spent için)
  pts?: number;
  amount?: number;
  time: string;
  rawTime: number;       // Unix ms — sıralama için
  status?: string;
  originalTx?: Transaction; // Düzenleme butonu için
  description?: string;
  metadata?: any;
}"""

content = content.replace(old_activity_item, new_activity_item)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
