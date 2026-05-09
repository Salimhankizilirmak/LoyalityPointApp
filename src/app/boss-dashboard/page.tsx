"use client";

import { OrganizationSwitcher, OrganizationProfile, useOrganization } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function BossDashboard() {
  const { isLoaded, organization } = useOrganization();

  if (!isLoaded) return <div className="p-8 flex justify-center items-center h-screen bg-neutral-950 text-white">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Patron Paneli
          </h1>
          <OrganizationSwitcher hidePersonal={true} appearance={{
            elements: {
              organizationSwitcherTrigger: "bg-white/10 hover:bg-white/20 text-white border-none rounded-md px-4 py-2 transition-all",
            }
          }} />
        </div>

        {organization ? (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-neutral-400 text-sm font-medium">Toplam Çalışan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{organization.membersCount || 0}</div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-neutral-400 text-sm font-medium">Aktif Müşteriler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">---</div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-neutral-400 text-sm font-medium">Dağıtılan Toplam Puan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-400">---</div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Clerk Organization Profile */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/5 p-6 rounded-xl border border-white/10 backdrop-blur-md shadow-2xl">
              <h2 className="text-xl font-semibold mb-6 text-white">Organizasyon ve Çalışan Yönetimi</h2>
              <div className="flex justify-center w-full overflow-hidden rounded-lg [&>.cl-rootBox]:w-full">
                <OrganizationProfile appearance={{
                  elements: {
                    rootBox: "w-full",
                    cardBox: "w-full shadow-none",
                    card: "bg-transparent shadow-none w-full max-w-full",
                    headerTitle: "text-white",
                    headerSubtitle: "text-neutral-400",
                    navbarButton: "text-neutral-400 hover:text-white hover:bg-white/5",
                    profileSectionTitle: "text-white",
                    profileSectionPrimaryButton: "text-emerald-400 hover:bg-emerald-400/10",
                    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    tableHead: "text-neutral-400",
                    tableCell: "text-white",
                    formButtonPrimary: "bg-emerald-600 hover:bg-emerald-700 text-white",
                    formFieldInput: "bg-white/5 border-white/10 text-white",
                    formFieldLabel: "text-neutral-300",
                    dividerLine: "bg-white/10",
                    userPreviewMainIdentifier: "text-white",
                    userPreviewSecondaryIdentifier: "text-neutral-400",
                    organizationSwitcherTrigger: "text-white"
                  }
                }} />
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
            <h2 className="text-xl text-neutral-300 mb-4">Lütfen yukarıdan bir organizasyon seçin.</h2>
          </div>
        )}
      </motion.div>
    </div>
  );
}
