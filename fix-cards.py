import re

file_path = "src/app/(cashier)/cashier-dashboard/client-page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_grid = """          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 w-full max-w-4xl mt-2">
            <div className={`flex flex-col items-center justify-center py-2.5 rounded-2xl border ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Activity size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">İşlem</span>
              </div>
              <span className={`text-lg font-black font-mono ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                {state.stats.totalTxToday}
              </span>
            </div>
            
            <div className={`flex flex-col items-center justify-center py-2.5 rounded-2xl border ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center gap-1.5 text-cyan-500 mb-1">
                <Coins size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">Verilen<br/>Puan</span>
              </div>
              <span className="text-lg font-black font-mono text-cyan-500">
                {fmt(state.stats.ptsGivenToday)}
              </span>
            </div>

            <div className={`flex flex-col items-center justify-center py-2.5 rounded-2xl border ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                <CreditCard size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">Harcanan<br/>Puan</span>
              </div>
              <span className="text-lg font-black font-mono text-amber-500">
                {fmt(state.stats.ptsBurnedToday || 0)}
              </span>
            </div>
            
            <div className={`flex flex-col items-center justify-center py-2.5 rounded-2xl border ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
                <UsersIcon size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">Yeni Üye</span>
              </div>
              <span className="text-lg font-black font-mono text-emerald-500">
                {state.stats.newMembersToday}
              </span>
            </div>

            <div className={`flex flex-col items-center justify-center py-2.5 rounded-2xl border ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center gap-1.5 text-indigo-500 mb-1">
                <Percent size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">Kazanç<br/>Oranı</span>
              </div>
              <span className="text-lg font-black font-mono text-indigo-500">
                {state.activeCampaign ? `%${state.activeCampaign.earnRatio || 0}` : "%0"}
              </span>
            </div>

            <div className={`flex flex-col items-center justify-center py-2.5 rounded-2xl border ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center gap-1.5 text-violet-500 mb-1">
                <TrendingUp size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">1 TL<br/>Değeri</span>
              </div>
              <span className="text-lg font-black font-mono text-violet-500">
                {state.activeCampaign ? `${(state.activeCampaign.earnRatio || 0) / 100} Pts` : "0 Pts"}
              </span>
            </div>
          </div>"""

new_grid = """          <div className="flex flex-nowrap overflow-x-auto gap-3 w-full mt-2 pb-2 custom-scrollbar">
            <div className={`flex flex-col items-center justify-center min-w-[90px] px-3 py-2.5 rounded-2xl border shrink-0 ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Activity size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">İşlem</span>
              </div>
              <span className={`text-lg font-black font-mono ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                {state.stats.totalTxToday}
              </span>
            </div>
            
            <div className={`flex flex-col items-center justify-center min-w-[90px] px-3 py-2.5 rounded-2xl border shrink-0 ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center gap-1.5 text-cyan-500 mb-1">
                <Coins size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">Verilen<br/>Puan</span>
              </div>
              <span className="text-lg font-black font-mono text-cyan-500">
                {fmt(state.stats.ptsGivenToday)}
              </span>
            </div>

            <div className={`flex flex-col items-center justify-center min-w-[90px] px-3 py-2.5 rounded-2xl border shrink-0 ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                <CreditCard size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">Harcanan<br/>Puan</span>
              </div>
              <span className="text-lg font-black font-mono text-amber-500">
                {fmt(state.stats.ptsBurnedToday || 0)}
              </span>
            </div>
            
            <div className={`flex flex-col items-center justify-center min-w-[90px] px-3 py-2.5 rounded-2xl border shrink-0 ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
                <UsersIcon size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">Yeni Üye</span>
              </div>
              <span className="text-lg font-black font-mono text-emerald-500">
                {state.stats.newMembersToday}
              </span>
            </div>

            <div className={`flex flex-col items-center justify-center min-w-[100px] px-3 py-2.5 rounded-2xl border shrink-0 ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center gap-1.5 text-indigo-500 mb-1">
                <Percent size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">Kazanç<br/>Oranı</span>
              </div>
              <span className="text-lg font-black font-mono text-indigo-500">
                %{state.stats.earnRatio}
              </span>
            </div>

            <div className={`flex flex-col items-center justify-center min-w-[110px] px-3 py-2.5 rounded-2xl border shrink-0 ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center gap-1.5 text-violet-500 mb-1">
                <TrendingUp size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">Dönüşüm<br/>Değeri</span>
              </div>
              <span className="text-lg font-black font-mono text-violet-500">
                {state.stats.tlEquivalent}TL={state.stats.pointsEquivalent}Pts
              </span>
            </div>
          </div>"""

content = content.replace(old_grid, new_grid)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

