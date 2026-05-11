"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClerk, useUser } from "@clerk/nextjs";

// Components
import { ManagerHeader } from "@/components/features/manager-dashboard/ManagerHeader";
import { OverviewStats } from "@/components/features/manager-dashboard/OverviewStats";
import { TransactionFeed } from "@/components/features/manager-dashboard/TransactionFeed";
import { EmployeeManagement } from "@/components/features/manager-dashboard/EmployeeManagement";
import { CustomerManagement } from "@/components/features/manager-dashboard/CustomerManagement";
import { AddCustomerModal } from "@/components/features/manager-dashboard/AddCustomerModal";
import { InviteModal } from "@/components/features/boss-dashboard/InviteModal";

// Types
import { Transaction, Customer, Employee } from "@/components/features/manager-dashboard/types";

// Mock Data
const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 1, customer: "Fatma G.", type: "earned", pts: 240, amount: 480, cashier: "Ayşe K.", time: "14:38" },
  { id: 2, customer: "Mehmet K.", type: "spent", pts: -150, amount: 320, cashier: "Burak Ş.", time: "14:35" },
  { id: 3, customer: "Zeynep A.", type: "earned", pts: 180, amount: 360, cashier: "Ayşe K.", time: "14:31" },
];

const MOCK_CUSTOMERS: Customer[] = [
  { id: "c1", firstName: "Fatma", lastName: "Güler", phone: "0532 111 22 33", email: "fatma@ornek.com", currentPoints: 4820 },
  { id: "c2", firstName: "Mehmet", lastName: "Koç", phone: "0541 222 33 44", email: "mehmet@ornek.com", currentPoints: 2140 },
];

const MOCK_CASHIERS: Employee[] = [
  { id: "e1", name: "Ayşe Korkmaz", email: "ayse@ornek.com", role: "cashier", avatar: "AK", status: "active", txCount: 47, newReg: 4 },
  { id: "e2", name: "Burak Şahin", email: "burak@ornek.com", role: "cashier", avatar: "BŞ", status: "active", txCount: 38, newReg: 2 },
];

const TABS = ["Genel Bakış", "Müşteriler", "Ekibim"];

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showMockData, setShowMockData] = useState(true);
  
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [cashiers, setCashiers] = useState<Employee[]>(MOCK_CASHIERS);
  
  const [showInvite, setShowInvite] = useState(false);
  
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleAddCustomer = async (data: { firstName: string; lastName: string; phone: string }) => {
    const newCust: Customer = {
      id: `c-${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: "",
      currentPoints: 100
    };
    setCustomers(prev => [newCust, ...prev]);
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${isDarkMode ? "bg-[#020817]" : "bg-slate-50"}`}>
      <AnimatePresence>
        {showInvite && (
          <InviteModal 
            onClose={() => setShowInvite(false)} 
            branches={[]} // Yöneticiler şube ataması yapamaz, kendi şubelerine atanır
            isDarkMode={isDarkMode}
            fixedRole="cashier"
          />
        )}
      </AnimatePresence>

      <ManagerHeader 
        user={user}
        showMockData={showMockData}
        setShowMockData={setShowMockData}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        signOut={() => signOut({ redirectUrl: "/" })}
        tabs={TABS}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <OverviewStats 
                    txCount={transactions.length}
                    totalPts={4800}
                    activeEmployees={`${cashiers.length} / 5`}
                    isDarkMode={isDarkMode}
                  />
                  <TransactionFeed 
                    transactions={transactions}
                    isDarkMode={isDarkMode}
                    onEdit={() => {}}
                    flash={false}
                  />
                </div>
                <div>
                  <EmployeeManagement 
                    employees={cashiers}
                    isDarkMode={isDarkMode}
                    onUpdate={async () => {}}
                    onRemove={async () => {}}
                    onAddClick={() => setShowInvite(true)}
                    loadingId={null}
                  />
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className={`rounded-3xl p-8 border transition-all ${
                isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-white border-slate-100 shadow-sm"
              }`}>
                <CustomerManagement 
                  customers={customers}
                  isDarkMode={isDarkMode}
                  onUpdate={async () => {}}
                  onDelete={async () => {}}
                  onAdd={handleAddCustomer}
                  loadingId={null}
                />
              </div>
            )}
            
            {activeTab === 2 && (
              <div className={`rounded-3xl p-8 border transition-all ${
                isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-white border-slate-100 shadow-sm"
              }`}>
                <EmployeeManagement 
                  employees={cashiers}
                  isDarkMode={isDarkMode}
                  onUpdate={async () => {}}
                  onRemove={async () => {}}
                  onAddClick={() => setShowInvite(true)}
                  loadingId={null}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
