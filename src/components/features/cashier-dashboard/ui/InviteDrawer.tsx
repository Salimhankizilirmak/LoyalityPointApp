"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { InviteCustomerCard } from "./InviteCustomerCard";

interface InviteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  form: any;
  setField: (field: string, value: string) => void;
  isFormValid: boolean;
  isEmailValid: boolean;
  submitting: boolean;
  onSubmit: () => Promise<void>;
  isDarkMode: boolean;
}

export function InviteDrawer({
  isOpen,
  onClose,
  form,
  setField,
  isFormValid,
  isEmailValid,
  submitting,
  onSubmit,
  isDarkMode
}: InviteDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`relative w-full max-w-md h-full flex flex-col shadow-2xl z-10 overflow-y-auto border-l ${
              isDarkMode 
                ? "bg-slate-900 border-white/10" 
                : "bg-white border-slate-200"
            }`}
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-[12px]">Yeni Müşteri Davet Et</h3>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex-1">
              <InviteCustomerCard
                form={form}
                setField={setField}
                isFormValid={isFormValid}
                isEmailValid={isEmailValid}
                submitting={submitting}
                onSubmit={onSubmit}
                isDarkMode={isDarkMode}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
