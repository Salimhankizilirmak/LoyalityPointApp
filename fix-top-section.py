import re

file_path = "src/app/(cashier)/cashier-dashboard/client-page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Üst kısımı regex ile bulup değiştiriyoruz. 
pattern = r"\{\/\* ── 1\. ÜST KISIM: KAMPANYA VE STATS \(ÖZET PANELİ\) ── \*\/}.*?(?=\{\/\* ── 2\. ORTA KISIM: ARAMA VE MÜŞTERİ)"

new_section = """{/* ── 1. ÜST KISIM: KAMPANYA VE STATS (ÖZET PANELİ) ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full mb-2">
          
          {/* BÜYÜK KAMPANYA KARTI (1-3-3 dizilimindeki "1", 2 satır yüksekliğinde) */}
          <div className={`md:col-span-1 md:row-span-2 flex flex-col justify-center p-6 rounded-3xl border shadow-sm relative overflow-hidden ${
            isDarkMode ? "bg-indigo-900/30 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"
          }`}>
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Activity size={80} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1 z-10">Aktif Kampanya</span>
             {state.activeCampaign ? (
                <>
                  <span className={`text-xl font-black mb-2 z-10 ${isDarkMode ? "text-indigo-100" : "text-indigo-900"}`}>{state.activeCampaign.name}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md max-w-fit z-10 ${isDarkMode ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-500/10 text-indigo-600"}`}>
                    {state.activeCampaign.campaignType === "percentage" ? "Yüzdelik Kazanç" : "Kademeli Sistem"}
                  </span>
                </>
             ) : (
                <span className={`text-lg font-bold z-10 ${isDarkMode ? "text-indigo-300" : "text-indigo-700"}`}>Şu an aktif kampanya bulunmuyor</span>
             )}
          </div>

          {/* DİĞER 6 KART (Sağ Tarafta 3-3 Dizilim) */}
          <div className="md:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. İşlem (Mavi/Sky) */}
            <div className={`flex flex-col justify-between p-4 rounded-2xl border shadow-sm ${isDarkMode ? "bg-sky-900/10 border-sky-500/20" : "bg-sky-50 border-sky-200"}`}>
              <div className="flex items-center gap-2 text-sky-500 mb-2">
                <Activity size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">İşlem Sayısı</span>
              </div>
              <span className={`text-2xl font-black font-mono ${isDarkMode ? "text-white" : "text-sky-900"}`}>
                {state.stats.totalTxToday}
              </span>
            </div>

            {/* 2. Verilen Puan (Cyan) */}
            <div className={`flex flex-col justify-between p-4 rounded-2xl border shadow-sm ${isDarkMode ? "bg-cyan-900/10 border-cyan-500/20" : "bg-cyan-50 border-cyan-200"}`}>
              <div className="flex items-center gap-2 text-cyan-500 mb-2">
                <Coins size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Verilen Puan</span>
              </div>
              <span className={`text-2xl font-black font-mono ${isDarkMode ? "text-white" : "text-cyan-900"}`}>
                {fmt(state.stats.ptsGivenToday)}
              </span>
            </div>

            {/* 3. Harcanan Puan (Turuncu) */}
            <div className={`flex flex-col justify-between p-4 rounded-2xl border shadow-sm ${isDarkMode ? "bg-amber-900/10 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <CreditCard size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Harcanan Puan</span>
              </div>
              <span className={`text-2xl font-black font-mono ${isDarkMode ? "text-white" : "text-amber-900"}`}>
                {fmt(state.stats.ptsBurnedToday || 0)}
              </span>
            </div>

            {/* 4. Yeni Üye (Yeşil) */}
            <div className={`flex flex-col justify-between p-4 rounded-2xl border shadow-sm ${isDarkMode ? "bg-emerald-900/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"}`}>
              <div className="flex items-center gap-2 text-emerald-500 mb-2">
                <UsersIcon size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Yeni Üye</span>
              </div>
              <span className={`text-2xl font-black font-mono ${isDarkMode ? "text-white" : "text-emerald-900"}`}>
                {state.stats.newMembersToday}
              </span>
            </div>

            {/* 5. Kazanç Oranı (Mor) */}
            <div className={`flex flex-col justify-between p-4 rounded-2xl border shadow-sm ${isDarkMode ? "bg-purple-900/10 border-purple-500/20" : "bg-purple-50 border-purple-200"}`}>
              <div className="flex items-center gap-2 text-purple-500 mb-2">
                <Percent size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Kazanç Oranı</span>
              </div>
              <span className={`text-2xl font-black font-mono ${isDarkMode ? "text-white" : "text-purple-900"}`}>
                %{state.stats.earnRatio}
              </span>
            </div>

            {/* 6. Dönüşüm Değeri (Pembe) */}
            <div className={`flex flex-col justify-between p-4 rounded-2xl border shadow-sm ${isDarkMode ? "bg-fuchsia-900/10 border-fuchsia-500/20" : "bg-fuchsia-50 border-fuchsia-200"}`}>
              <div className="flex items-center gap-2 text-fuchsia-500 mb-2">
                <TrendingUp size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Dönüşüm Değeri</span>
              </div>
              <span className={`text-xl font-black font-mono ${isDarkMode ? "text-white" : "text-fuchsia-900"}`}>
                {state.stats.tlEquivalent} TL = {state.stats.pointsEquivalent} Pts
              </span>
            </div>

          </div>
        </div>

        """

# Eğer bir onceki regex pattern "1. ÜST KISIM: KAMPANYA VE STATS ──" diye geciyorsa onu da kontrol edelim.
pattern_old = r"\{\/\* ── 1\. ÜST KISIM: KAMPANYA VE STATS ── \*\/}.*?(?=\{\/\* ── 2\. ORTA KISIM: ARAMA VE MÜŞTERİ)"

if re.search(pattern, content, flags=re.DOTALL):
    content = re.sub(pattern, new_section, content, flags=re.DOTALL)
elif re.search(pattern_old, content, flags=re.DOTALL):
    content = re.sub(pattern_old, new_section, content, flags=re.DOTALL)
else:
    print("Pattern not found!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

