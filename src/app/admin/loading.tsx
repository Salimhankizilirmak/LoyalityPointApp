import React from "react";

export default function SuperAdminDashboardLoading() {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0f] text-white font-sans overflow-hidden" aria-label="Yükleniyor">
      {/* Header Skeleton */}
      <div className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 animate-pulse" />
            <div className="space-y-1.5">
              <div className="w-20 h-4 rounded bg-slate-800 animate-pulse" />
              <div className="w-16 h-2 rounded bg-slate-800/60 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            <div className="w-20 h-8 rounded-lg bg-slate-800 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Title and Button Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-3 bg-indigo-500 rounded" />
              <div className="w-20 h-3 rounded bg-slate-800 animate-pulse" />
            </div>
            <div className="w-48 h-7 rounded bg-slate-800 animate-pulse" />
            <div className="w-64 h-3.5 rounded bg-slate-800/60 animate-pulse" />
          </div>
        </div>

        {/* Content Section Placeholder */}
        <div className="bg-slate-950/40 border border-white/5 rounded-3xl p-6 space-y-6">
          {/* Tabs header inside Section */}
          <div className="flex gap-4 border-b border-white/5 pb-3">
            <div className="w-24 h-5 rounded bg-slate-800 animate-pulse" />
            <div className="w-24 h-5 rounded bg-slate-800 animate-pulse" />
          </div>

          {/* Metric cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-3">
                <div className="w-24 h-4 rounded bg-slate-800 animate-pulse" />
                <div className="w-16 h-8 rounded bg-slate-800 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Table Placeholder */}
          <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-900/10">
            <div className="bg-white/5 p-4 border-b border-white/5 grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-16 h-4 rounded bg-slate-800 animate-pulse" />
              ))}
            </div>
            <div className="divide-y divide-white/5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 grid grid-cols-5 gap-4 items-center">
                  <div className="w-28 h-4 rounded bg-slate-800 animate-pulse" />
                  <div className="w-12 h-4 rounded bg-slate-800 animate-pulse" />
                  <div className="w-16 h-4 rounded bg-slate-800 animate-pulse" />
                  <div className="w-20 h-4 rounded bg-slate-800/80 animate-pulse" />
                  <div className="w-14 h-6 rounded-full bg-slate-800 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
