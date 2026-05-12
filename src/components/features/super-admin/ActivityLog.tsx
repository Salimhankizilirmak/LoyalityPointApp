"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Terminal } from "lucide-react";

interface Log {
  id: number;
  type: "success" | "warn" | "error" | "info";
  msg: string;
  time: string;
  actor: string;
}

const LOG_COLORS = {
  success: { dot: "#22d3ee", text: "#67e8f9", label: "OK" },
  warn: { dot: "#f59e0b", text: "#fcd34d", label: "WARN" },
  error: { dot: "#f87171", text: "#fca5a5", label: "ERR" },
  info: { dot: "#818cf8", text: "#a5b4fc", label: "INFO" },
};

interface ActivityLogProps {
  logs: Log[];
}

export function ActivityLog({ logs }: ActivityLogProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [logs]);

  return (
    <div className="rounded-2xl overflow-hidden h-full flex flex-col"
      style={{ background: "#0a0f1e", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.3)" }}>
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-cyan-500" />
          <span className="text-slate-300 text-xs font-semibold tracking-wider uppercase">Activity Log</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-500 text-xs font-mono">LIVE</span>
        </div>
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs" style={{ maxHeight: 340 }}>
        {logs.map((log, i) => {
          const c = LOG_COLORS[log.type];
          return (
            <motion.div key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors group">
              <span className="text-slate-700 flex-shrink-0 mt-0.5">{log.time}</span>
              <span className="px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0"
                style={{ background: `${c.dot}15`, color: c.text }}>{c.label}</span>
              <span className="text-slate-400 flex-1 leading-relaxed">{log.msg}</span>
              <span className="text-slate-700 flex-shrink-0 hidden group-hover:block">{log.actor}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
