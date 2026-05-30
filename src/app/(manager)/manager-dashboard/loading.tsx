import React from "react";

export default function ManagerDashboardLoading() {
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden" aria-label="Yükleniyor">
      {/* Header Skeleton */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse" />
            <div className="space-y-1.5">
              <div className="w-24 h-4 rounded bg-slate-200 animate-pulse" />
              <div className="w-16 h-3 rounded bg-slate-200/60 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
            <div className="w-20 h-8 rounded-lg bg-slate-200 animate-pulse" />
          </div>
        </div>
        {/* Navigation Tabs Placeholder */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex gap-6 items-center">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-16 h-4 rounded bg-slate-200 animate-pulse" />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="w-48 h-6 rounded bg-slate-200 animate-pulse" />
              <div className="w-32 h-3.5 rounded bg-slate-200/60 animate-pulse" />
            </div>
            <div className="w-28 h-10 rounded-xl bg-slate-200 animate-pulse" />
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-100 grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-20 h-4 rounded bg-slate-200 animate-pulse" />
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 grid grid-cols-4 gap-4 items-center">
                  <div className="w-24 h-4 rounded bg-slate-200 animate-pulse" />
                  <div className="w-16 h-4 rounded bg-slate-200 animate-pulse" />
                  <div className="w-20 h-4 rounded bg-slate-200/80 animate-pulse" />
                  <div className="w-12 h-6 rounded-full bg-slate-200 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
