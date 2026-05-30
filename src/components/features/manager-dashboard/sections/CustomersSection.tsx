"use client";

import { CustomerManagement } from "../ui/CustomerManagement";
import { Customer, Transaction } from "../types";

interface CustomersSectionProps {
  customers: Customer[];
  transactions: Transaction[];
  isDarkMode: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function CustomersSection({
  customers,
  transactions,
  isDarkMode,
  searchQuery,
  onSearchChange
}: CustomersSectionProps) {
  return (
    <div className="glass-panel-elevated rounded-3xl p-8 transition-all">
      <CustomerManagement 
        customers={customers}
        transactions={transactions}
        isDarkMode={isDarkMode}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
    </div>
  );
}
