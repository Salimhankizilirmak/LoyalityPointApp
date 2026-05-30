import React from "react";

export default function BossDashboardLoading() {
  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-white font-sans overflow-hidden" aria-label="Yükleniyor">
      {/* Header Skeleton */}
      <div className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo placeholder */}
            <div className="w-10 h-10 rounded-xl bg-slate-800 animate-pulse" />
            <div className="space-y-2">
              <div className="w-24 h-4 rounded bg-slate-800 animate-pulse" />
              <div className="w-16 h-3 rounded bg-slate-800/60 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            <div className="w-20 h-8 rounded-lg bg-slate-800 animate-pulse" />
          </div>
        </div>
        {/* Navigation Tabs Placeholder */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex gap-6 items-center">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-16 h-4 rounded bg-slate-800 animate-pulse" />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-24 h-4 rounded bg-slate-800 animate-pulse" />
                <div className="w-8 h-8 rounded-2xl bg-slate-800 animate-pulse" />
              </div>
              <div className="w-16 h-8 rounded bg-slate-800 animate-pulse" />
              <div className="w-32 h-3 rounded bg-slate-800/60 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Dynamic Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-36 h-6 rounded bg-slate-800 animate-pulse" />
                <div className="w-24 h-8 rounded-lg bg-slate-800 animate-pulse" />
              </div>
              <div className="h-64 w-full rounded-2xl bg-slate-900/80 animate-pulse flex items-center justify-center border border-slate-800/40">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="w-36 h-6 rounded bg-slate-800 animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/30">
                    <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="w-24 h-3 rounded bg-slate-800 animate-pulse" />
                      <div className="w-16 h-2 rounded bg-slate-800/60 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
