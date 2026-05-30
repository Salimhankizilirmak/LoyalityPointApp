import React from "react";

export default function CashierDashboardLoading() {
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden" aria-label="Yükleniyor">
      {/* Header Skeleton */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-200 animate-pulse" />
            <div className="space-y-1">
              <div className="w-20 h-3 rounded bg-slate-200 animate-pulse" />
              <div className="w-12 h-2 rounded bg-slate-200/60 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-7 rounded-lg bg-slate-200 animate-pulse" />
            <div className="w-16 h-7 rounded-lg bg-slate-200 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (Scanner & Forms) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl p-4 bg-white border border-slate-200 text-center space-y-2">
                <div className="w-8 h-8 rounded-xl bg-slate-200 mx-auto animate-pulse" />
                <div className="w-12 h-4 rounded bg-slate-200 mx-auto animate-pulse" />
                <div className="w-16 h-2 rounded bg-slate-200/60 mx-auto animate-pulse" />
              </div>
            ))}
          </div>

          {/* Scanner Card */}
          <div className="rounded-3xl p-6 bg-white border border-slate-200 space-y-6">
            <div className="flex justify-between items-center">
              <div className="w-36 h-5 rounded bg-slate-200 animate-pulse" />
              <div className="w-24 h-8 rounded-xl bg-slate-200/80 animate-pulse" />
            </div>
            {/* Input field skeleton */}
            <div className="h-14 w-full rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 rounded-xl bg-slate-200 animate-pulse" />
              <div className="h-10 rounded-xl bg-slate-200 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Right column (Recent Transactions) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 h-[500px]">
          <div className="w-36 h-5 rounded bg-slate-200 animate-pulse" />
          <div className="space-y-3.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <div className="space-y-1.5">
                  <div className="w-24 h-3.5 rounded bg-slate-200 animate-pulse" />
                  <div className="w-16 h-2 rounded bg-slate-200/60 animate-pulse" />
                </div>
                <div className="w-12 h-4 rounded bg-slate-200 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
