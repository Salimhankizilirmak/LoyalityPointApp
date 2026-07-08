import sys

file_path = "src/components/features/manager-dashboard/ui/TransactionFeed.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Import useState and X icon
if "useState" not in content:
    content = content.replace('import { motion } from "framer-motion";', 'import React, { useState } from "react";\nimport { motion, AnimatePresence } from "framer-motion";')
if "X," not in content:
    content = content.replace('Settings,', 'Settings,\n  X,')

# 2. ActivityRow Props
old_row_props = """function ActivityRow({
  item,
  index,
  isDarkMode,
  onEdit,
}: {
  item: ActivityItem;
  index: number;
  isDarkMode: boolean;
  onEdit: (tx: Transaction) => void;
}) {"""
new_row_props = """function ActivityRow({
  item,
  index,
  isDarkMode,
  onEdit,
  onClick,
}: {
  item: ActivityItem;
  index: number;
  isDarkMode: boolean;
  onEdit: (tx: Transaction) => void;
  onClick: (item: ActivityItem) => void;
}) {"""
content = content.replace(old_row_props, new_row_props)

# 3. ActivityRow motion.div
old_motion = """    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`flex items-center gap-4 px-4 py-3.5 group transition-colors rounded-xl ${
        isVoided
          ? "bg-rose-950/10 border border-rose-500/20"
          : "hover:bg-white/5"
      }`}
    >"""
new_motion = """    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => onClick(item)}
      className={`flex items-center gap-4 px-4 py-3.5 group transition-colors rounded-xl cursor-pointer ${
        isVoided
          ? "bg-rose-950/10 border border-rose-500/20"
          : "hover:bg-white/5"
      }`}
    >"""
content = content.replace(old_motion, new_motion)

# 4. Event label click trigger stop propagation
content = content.replace('onClick={() => onEdit(item.originalTx!)}', 'onClick={(e) => { e.stopPropagation(); onEdit(item.originalTx!); }}')

# 5. TransactionFeed component implementation
old_feed = """export function TransactionFeed({
  activities,
  isDarkMode,
  onEdit,
}: TransactionFeedProps) {"""
new_feed = """export function TransactionFeed({
  activities,
  isDarkMode,
  onEdit,
}: TransactionFeedProps) {
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  const renderMetadata = (metadata: any) => {
    if (!metadata) return null;
    try {
      const parsed = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
      return (
        <div className="mt-4 bg-black/40 rounded-xl p-4 border border-white/5 overflow-x-auto">
          <pre className="text-xs text-emerald-400 font-mono">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        </div>
      );
    } catch {
      return (
        <div className="mt-4 bg-black/40 rounded-xl p-4 border border-white/5 text-xs text-neutral-400 font-mono">
          {String(metadata)}
        </div>
      );
    }
  };
"""
content = content.replace(old_feed, new_feed)

# 6. Map ActivityRow
old_map = """      {activities.map((item, i) => (
        <ActivityRow
          key={item.id}
          item={item}
          index={i}
          isDarkMode={isDarkMode}
          onEdit={onEdit}
        />
      ))}"""
new_map = """      {activities.map((item, i) => (
        <ActivityRow
          key={item.id}
          item={item}
          index={i}
          isDarkMode={isDarkMode}
          onEdit={onEdit}
          onClick={setSelectedActivity}
        />
      ))}
      
      {/* Detay Modal'ı */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setSelectedActivity(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f0f13] border border-white/10 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedActivity(null)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-neutral-400 transition-colors"
              >
                <X size={18} />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: ACTIVITY_CONFIG[selectedActivity.type]?.bg || ACTIVITY_CONFIG.system.bg,
                    border: `1px solid ${ACTIVITY_CONFIG[selectedActivity.type]?.border || ACTIVITY_CONFIG.system.border}`
                  }}
                >
                  {(() => {
                    const Icon = ACTIVITY_CONFIG[selectedActivity.type]?.icon || ACTIVITY_CONFIG.system.icon;
                    return <Icon size={20} style={{ color: ACTIVITY_CONFIG[selectedActivity.type]?.color || ACTIVITY_CONFIG.system.color }} />
                  })()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Log Detayı</h3>
                  <p className="text-xs text-neutral-400 uppercase tracking-widest font-bold">
                    {ACTIVITY_CONFIG[selectedActivity.type]?.label || "Sistem"}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Tarih</span>
                    <span className="text-sm font-semibold text-white">{selectedActivity.time}</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Kullanıcı (Aktör)</span>
                    <span className="text-sm font-semibold text-white">{selectedActivity.actorName || "-"}</span>
                  </div>
                </div>
                
                {selectedActivity.targetName && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Hedef / Müşteri</span>
                    <span className="text-sm font-semibold text-indigo-400">{selectedActivity.targetName}</span>
                  </div>
                )}
                
                <div className="bg-white/5 rounded-xl p-4">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Açıklama / Detay</span>
                  <p className="text-sm text-neutral-300 font-medium leading-relaxed">
                    {selectedActivity.description || "Açıklama bulunmuyor."}
                  </p>
                </div>
                
                {/* Her logda orijinal obje (metadata) varsa */}
                {selectedActivity.originalTx ? (
                   renderMetadata(selectedActivity.originalTx)
                ) : (
                   renderMetadata(selectedActivity.metadata)
                )}
                
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>"""
content = content.replace(old_map, new_map)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
