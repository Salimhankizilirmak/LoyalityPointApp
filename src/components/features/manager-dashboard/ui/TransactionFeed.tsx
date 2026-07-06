"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  UserCheck,
  UserPlus,
  Sparkles,
  AlertTriangle,
  Edit3,
  Settings,
} from "lucide-react";
import { ActivityItem, Transaction } from "../types";

interface TransactionFeedProps {
  activities: ActivityItem[];
  isDarkMode: boolean;
  onEdit: (tx: Transaction) => void;
}

const ACTIVITY_CONFIG = {
  earned: {
    label: "Puan Kazandı",
    color: "#059669",
    bg: "rgba(5,150,105,0.10)",
    border: "rgba(5,150,105,0.20)",
    icon: ArrowUpRight,
  },
  spent: {
    label: "Puan Harcadı",
    color: "#d97706",
    bg: "rgba(217,119,6,0.10)",
    border: "rgba(217,119,6,0.20)",
    icon: ArrowDownRight,
  },
  cashier_invited: {
    label: "Kasiyer Davet Edildi",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.10)",
    border: "rgba(99,102,241,0.20)",
    icon: Mail,
  },
  cashier_accepted: {
    label: "Kasiyer Katıldı",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.10)",
    border: "rgba(6,182,212,0.20)",
    icon: UserCheck,
  },
  customer_invited: {
    label: "Müşteri Davet Edildi",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.10)",
    border: "rgba(139,92,246,0.20)",
    icon: UserPlus,
  },
  customer_accepted: {
    label: "Müşteri Kaydoldu",
    color: "#0d9488",
    bg: "rgba(13,148,136,0.10)",
    border: "rgba(13,148,136,0.20)",
    icon: Sparkles,
  },
  void: {
    label: "İşlem İptal",
    color: "#f43f5e",
    bg: "rgba(244,63,94,0.08)",
    border: "rgba(244,63,94,0.20)",
    icon: AlertTriangle,
  },
  system: {
    label: "Sistem",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.10)",
    border: "rgba(148,163,184,0.20)",
    icon: Settings,
  },
} as const;

function ActivityRow({
  item,
  index,
  isDarkMode,
  onEdit,
}: {
  item: ActivityItem;
  index: number;
  isDarkMode: boolean;
  onEdit: (tx: Transaction) => void;
}) {
  const isVoided = item.type === "void";
  const cfg = ACTIVITY_CONFIG[item.type] ?? ACTIVITY_CONFIG.earned;
  const Icon = cfg.icon;

  const isPtsEvent = item.type === "earned" || item.type === "spent" || item.type === "void";
  const isInviteEvent = item.type === "cashier_invited" || item.type === "cashier_accepted" || item.type === "customer_invited" || item.type === "customer_accepted";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`flex items-center gap-4 px-4 py-3.5 group transition-colors rounded-xl ${
        isVoided
          ? "bg-rose-950/10 border border-rose-500/20"
          : "hover:bg-white/5"
      }`}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
        style={{ background: isVoided ? ACTIVITY_CONFIG.void.bg : cfg.bg, border: `1px solid ${isVoided ? ACTIVITY_CONFIG.void.border : cfg.border}` }}
      >
        <Icon size={16} style={{ color: isVoided ? ACTIVITY_CONFIG.void.color : cfg.color }} />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        {/* Event label badge */}
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              background: isVoided ? ACTIVITY_CONFIG.void.bg : cfg.bg,
              color: isVoided ? ACTIVITY_CONFIG.void.color : cfg.color,
            }}
          >
            {cfg.label}
          </span>
          {isVoided && (
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[8px] font-black uppercase tracking-wider">
              VOID
            </span>
          )}
        </div>

        {/* Actor & target */}
        {isPtsEvent ? (
          <p className="text-xs font-semibold text-white truncate">
            {item.targetName}
            {item.actorName && item.actorName !== "Kasiyer" && (
              <span className="text-neutral-500 font-normal ml-1">· {item.actorName}</span>
            )}
          </p>
        ) : (
          <p className="text-xs font-semibold text-neutral-300 truncate">
            {item.actorName}
          </p>
        )}
      </div>

      {/* Right — pts or status */}
      <div className="text-right flex-shrink-0">
        {isPtsEvent && item.pts !== undefined ? (
          <>
            <p
              className="text-xs font-black tracking-tight"
              style={{ color: isVoided ? ACTIVITY_CONFIG.void.color : cfg.color }}
            >
              {item.pts > 0 && !isVoided ? "+" : ""}
              {item.pts} p
            </p>
            <p className="text-neutral-500 text-[10px] font-medium mt-0.5">{item.time}</p>
          </>
        ) : isInviteEvent ? (
          <>
            <p className="text-[10px] font-bold text-neutral-400 mt-0.5">{item.time}</p>
          </>
        ) : (
          <p className="text-neutral-500 text-[10px]">{item.time}</p>
        )}
      </div>

      {/* Edit button — only for loyalty transactions */}
      {isPtsEvent && !isVoided && item.originalTx && (
        <button
          onClick={() => onEdit(item.originalTx!)}
          className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all ${
            isDarkMode
              ? "hover:bg-slate-700 text-slate-500"
              : "hover:bg-slate-100 text-slate-400"
          }`}
        >
          <Edit3 size={14} />
        </button>
      )}
    </motion.div>
  );
}

export function TransactionFeed({
  activities,
  isDarkMode,
  onEdit,
}: TransactionFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-neutral-900/60 border border-white/5 flex items-center justify-center">
          <ArrowUpRight size={20} className="text-neutral-600" />
        </div>
        <p className="text-neutral-500 text-sm font-semibold">Henüz işlem bulunmuyor.</p>
        <p className="text-neutral-600 text-xs mt-1">Müşteri işlemleri ve davetler burada görünecek.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {activities.map((item, i) => (
        <ActivityRow
          key={item.id}
          item={item}
          index={i}
          isDarkMode={isDarkMode}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
