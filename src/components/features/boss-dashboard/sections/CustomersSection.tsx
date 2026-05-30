"use client";

import { CustomerManagement } from "@/components/features/manager-dashboard/ui/CustomerManagement";
import { Customer } from "@/components/features/manager-dashboard/types";

interface CustomersSectionProps {
  displayCustomers: Customer[];
  isDarkMode: boolean;
  handleAddCustomer?: (data: { firstName: string; lastName: string; phone: string }) => Promise<void>;
}

export function CustomersSection({
  displayCustomers,
  isDarkMode
}: CustomersSectionProps) {
  return (
    <CustomerManagement
      customers={displayCustomers}
      isDarkMode={isDarkMode}
      onUpdate={async () => { }}
      onDelete={async () => { }}
      loadingId={null}
      hideAddButton={true}
    />
  );
}
