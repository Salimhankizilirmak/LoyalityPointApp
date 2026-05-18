import { checkLayoutGuard } from "@/lib/layout-guard";
import { ReactNode } from "react";

interface CustomerLayoutProps {
  children: ReactNode;
}

export default async function CustomerLayout({ children }: CustomerLayoutProps) {
  await checkLayoutGuard();
  return (
    <div className="relative min-h-screen bg-slate-50">
      {children}
    </div>
  );
}
