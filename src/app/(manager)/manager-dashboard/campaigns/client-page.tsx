"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CampaignSection } from "@/components/features/manager-dashboard/sections";

export function CampaignsClient() {
  const isDarkMode = true;

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -10 }} 
          transition={{ duration: 0.2 }}
        >
          <CampaignSection isDarkMode={isDarkMode} />
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
