import React from "react";

export default function CustomerDashboardLoading() {
  return (
    <div className="min-h-screen flex flex-col max-w-sm mx-auto shadow-2xl border-x border-slate-100 bg-slate-50 font-sans overflow-hidden" aria-label="Yükleniyor">
      {/* Top Profile Area Skeleton */}
      <div className="px-5 pt-8 pb-4 space-y-6 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 animate-pulse" />
            <div className="space-y-1.5">
              <div className="w-12 h-3 rounded bg-slate-200 animate-pulse" />
              <div className="w-24 h-4 rounded bg-slate-200 animate-pulse" />
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-200 animate-pulse" />
        </div>

        {/* Big Points Card Skeleton */}
        <div className="rounded-3xl p-6 h-40 bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse relative overflow-hidden">
          <div className="absolute top-4 left-4 w-24 h-3 rounded bg-white/20" />
          <div className="absolute top-9 left-4 w-16 h-8 rounded bg-white/30" />
          <div className="absolute bottom-4 left-4 w-32 h-6 rounded bg-white/20" />
        </div>

        {/* Small stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center p-3 rounded-2xl bg-white border border-slate-100 space-y-2 shadow-sm">
              <div className="w-12 h-4 rounded bg-slate-200 mx-auto animate-pulse" />
              <div className="w-8 h-2 rounded bg-slate-200/60 mx-auto animate-pulse" />
            </div>
          ))}
        </div>

        {/* QR Code Container Skeleton */}
        <div className="flex flex-col items-center py-6 space-y-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="space-y-1.5 text-center">
            <div className="w-24 h-4 rounded bg-slate-200 mx-auto animate-pulse" />
            <div className="w-36 h-2 rounded bg-slate-200/60 mx-auto animate-pulse" />
          </div>
          {/* QR code square box */}
          <div className="w-40 h-40 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center animate-pulse" />
          <div className="w-20 h-4 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>

      {/* Bottom Sticky Tab Bar Skeleton */}
      <nav className="flex gap-1 px-5 pt-3 pb-6 bg-white border-t border-slate-150 sticky bottom-0 z-10">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 py-2">
            <div className="w-5 h-5 rounded-full bg-slate-200 animate-pulse" />
            <div className="w-8 h-2 rounded bg-slate-200/60 animate-pulse" />
          </div>
        ))}
      </nav>
    </div>
  );
}
