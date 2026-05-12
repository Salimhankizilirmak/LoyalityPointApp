"use client";

import React, { useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlassInput } from "@/components/ui/GlassInput";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { inviteCustomerAction } from "@/app/cashier-dashboard/actions";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export function RegisterTab() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMsg(null);
    const result = await inviteCustomerAction(formData);
    if (result && "error" in result) {
      setMsg({ type: "error", text: String(result.error) });
    } else if (result && "success" in result && result.success) {
      setMsg({ type: "success", text: (result as { message?: string }).message || "Müşteri başarıyla eklendi." });
      const form = document.getElementById("reg-form") as HTMLFormElement;
      if (form) form.reset();
    }
    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto w-full">
      <GlassPanel className="p-8" elevated>
        <div className="mb-6">
          <h3 className="font-headline-md text-headline-md text-on-surface">New Customer Registration</h3>
          <p className="font-body-md text-on-surface-variant mt-2">
            Register a new customer. An invitation link will be sent to their email.
          </p>
        </div>

        <form id="reg-form" action={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">First Name</label>
              <GlassInput name="firstName" required placeholder="John" />
            </div>
            <div className="space-y-2">
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Last Name</label>
              <GlassInput name="lastName" required placeholder="Doe" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Phone</label>
            <GlassInput name="phone" type="tel" required placeholder="+90 555 555 5555" />
          </div>
          
          <div className="space-y-2">
            <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Email</label>
            <GlassInput name="email" type="email" required placeholder="john@example.com" />
          </div>

          {msg && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl text-sm flex items-start gap-3 ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              <div className="mt-0.5">{msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}</div>
              <div className="text-base">{msg.text}</div>
            </motion.div>
          )}

          <PrimaryButton type="submit" disabled={loading} className="w-full mt-4">
            {loading ? "Registering..." : "Add to System"}
          </PrimaryButton>
        </form>
      </GlassPanel>
    </div>
  );
}
