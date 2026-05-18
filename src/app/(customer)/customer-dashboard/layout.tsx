import { ReactNode } from "react";

interface CustomerLayoutProps {
  children: ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  return (
    <div className="relative min-h-screen bg-slate-50">
      {children}
    </div>
  );
}
