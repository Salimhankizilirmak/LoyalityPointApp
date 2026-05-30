"use client";

interface QuotaLimitAlertProps {
  realBranchesCount: number;
  branchLimit: number;
}

export function QuotaLimitAlert({ realBranchesCount, branchLimit }: QuotaLimitAlertProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 px-4 py-2.5 rounded-xl glass-panel border border-cyan-500/30 bg-cyan-950/20 text-cyan-200 text-sm font-medium animate-in fade-in slide-in-from-right-4">
      <span className="whitespace-nowrap">Şube kotanız dolmuştur ({realBranchesCount}/{branchLimit}).</span>
      <span className="opacity-80 text-xs sm:text-sm">
        Yeni şube yuvası satın almak için{" "}
        <a
          href="mailto:novexistech@gmail.com?subject=Şube%20Kota%20Artış%20Talebi"
          className="font-semibold hover:text-cyan-300 transition-colors underline underline-offset-4"
        >
          Novexistech
        </a>{" "}
        ile iletişime geçin.
      </span>
    </div>
  );
}
