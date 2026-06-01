"use client";

import { RecentTransactions } from "../ui/RecentTransactions";

interface RecentSalesSectionProps {
  refreshTrigger: number;
  showMockData?: boolean;
}

export function RecentSalesSection({ refreshTrigger, showMockData }: RecentSalesSectionProps) {
  return (
    <div className="lg:col-span-1">
      <RecentTransactions refreshTrigger={refreshTrigger} showMockData={showMockData} />
    </div>
  );
}
