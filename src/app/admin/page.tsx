"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createOrganizationAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function SuperAdminPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    const result = await createOrganizationAction(formData);
    
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else if (result.success) {
      setMessage({ type: "success", text: result.message! });
      // Formu temizlemek için
      const form = document.getElementById('add-org-form') as HTMLFormElement;
      if (form) form.reset();
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Decorative gradient blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
              Süper Admin Paneli
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Sisteme yeni bir organizasyon (firma) ekleyin.
            </CardDescription>
          </CardHeader>
          <form id="add-org-form" action={handleSubmit} className="relative z-10">
            <CardContent className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-neutral-300">Firma Adı</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="Örn: X Kahve Şubeleri" 
                    required 
                    className="bg-neutral-900/50 border-neutral-700 text-white placeholder:text-neutral-600 focus-visible:ring-red-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bossEmail" className="text-neutral-300">Patron E-posta (Davet Edilecek)</Label>
                  <Input 
                    id="bossEmail" 
                    name="bossEmail" 
                    type="email"
                    placeholder="patron@firma.com" 
                    required 
                    className="bg-neutral-900/50 border-neutral-700 text-white placeholder:text-neutral-600 focus-visible:ring-red-500 transition-all"
                  />
                </div>
              </div>

              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                >
                  {message.text}
                </motion.div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white border-0 shadow-lg shadow-red-900/20 transition-all"
              >
                {loading ? "Oluşturuluyor..." : "Firmayı Oluştur"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
