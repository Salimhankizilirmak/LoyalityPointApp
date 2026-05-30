"use client";

import { RecentTransactions } from "../ui/RecentTransactions";

interface RecentSalesSectionProps {
  refreshTrigger: number;
}

export function RecentSalesSection({ refreshTrigger }: RecentSalesSectionProps) {
  return (
    <div className="lg:col-span-1">
      <RecentTransactions refreshTrigger={refreshTrigger} />
    </div>
  );
}
