"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MapPin, Check, Loader2 } from "lucide-react";
import { setActiveBranchContextAction } from "@/app/actions/branch-context-actions";

export type BranchOption = {
  id: string;
  name: string;
  city: string;
};

interface BranchSelectorProps {
  activeBranchId: string;
  branches: BranchOption[];
}

/**
 * Indigo Prestige v2 – Glass-panel şube seçici dropdown.
 * Tek şube varsa tamamen gizlenir (No Client-Side Flash).
 */
export function BranchSelector({ activeBranchId, branches }: BranchSelectorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Kural 2: Tek şube → hiçbir şey render etme
  if (branches.length <= 1) return null;

  const activeBranch = branches.find((b) => b.id === activeBranchId) ?? branches[0];

  const handleSelect = (branchId: string) => {
    if (branchId === activeBranchId) {
      setOpen(false);
      return;
    }
    setOpen(false);
    startTransition(async () => {
      try {
        await setActiveBranchContextAction(branchId);
        router.refresh();
      } catch (err) {
        console.error("[BranchSelector] Branch switch failed:", err);
      }
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Aktif şube seçici"
        style={{ minHeight: "44px", minWidth: "44px" }}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-200 select-none cursor-pointer
          bg-[#0a0a0f]/80 backdrop-blur-md border-cyan-500/20 
          text-cyan-300 hover:border-cyan-500/40 hover:bg-[#0f1117]/90
          focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
      >
        <MapPin size={14} className="text-cyan-500 shrink-0" />
        <span className="text-sm font-semibold tracking-tight max-w-[140px] truncate">
          {activeBranch.name}
        </span>
        {pending ? (
          <Loader2 size={13} className="animate-spin text-cyan-400 shrink-0" />
        ) : (
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={13} className="text-cyan-400 shrink-0" />
          </motion.div>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="branch-dropdown"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            role="listbox"
            aria-label="Şube listesi"
            className="absolute right-0 mt-2 w-64 z-50 rounded-2xl overflow-hidden
              bg-[#0a0a0f]/80 backdrop-blur-md border border-cyan-500/20
              shadow-[0_8px_40px_rgba(6,182,212,0.08)]"
          >
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-cyan-500/10">
              <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-500/60">
                Şube Seç
              </p>
            </div>

            {/* Branch List */}
            <ul className="py-1.5 max-h-60 overflow-y-auto">
              {branches.map((branch) => {
                const isActive = branch.id === activeBranchId;
                return (
                  <li key={branch.id}>
                    <button
                      onClick={() => handleSelect(branch.id)}
                      role="option"
                      aria-selected={isActive}
                      style={{ minHeight: "44px" }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150 group
                        ${isActive
                          ? "bg-cyan-500/10 text-cyan-300"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all
                        ${isActive ? "bg-cyan-500" : "bg-white/5 group-hover:bg-white/10"}`}>
                        {isActive && <Check size={11} className="text-[#0a0a0f] font-black" strokeWidth={3} />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold leading-tight truncate">
                          {branch.name}
                        </span>
                        <span className="block text-[11px] text-slate-500 mt-0.5">
                          {branch.city}
                        </span>
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 shrink-0">
                          Aktif
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
