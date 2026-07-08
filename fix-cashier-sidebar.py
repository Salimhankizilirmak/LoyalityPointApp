import re

file_path = "src/app/(cashier)/cashier-dashboard/layout-client.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Eski ust div
old_header = """        <div className="flex items-center gap-4">
          {isMultiBranch && activeBranchId && allBranches && (
            <BranchSelector activeBranchId={activeBranchId} branches={allBranches} />
          )}
        </div>
      </header>"""

new_header = """        <div className="flex items-center gap-4">
          {/* Sadece mobil menü toggle ve logo kaldı, geri kalanı sidebar içine alındı */}
        </div>
      </header>"""
      
# Eger header içinde BranchSelector hala varsa (biraz once sildigimizi sanip replace etmistik ama bir onceki adim tam degilse) asagidaki yontemle arayalim:
old_header_full = """        <div className="flex items-center gap-4">
          {isMultiBranch && activeBranchId && allBranches && (
            <BranchSelector activeBranchId={activeBranchId} branches={allBranches} />
          )}
        </div>
      </header>"""

content = content.replace(old_header_full, new_header)


# Profil kismini nav uzerine tasiyalim ve Branch Selector ekleyelim.
# Asagidaki yapiyi arayacagiz:
old_sidebar_menu = """          <div className="flex items-center justify-between p-4 md:hidden border-b border-white/5">
            <span className="font-bold text-sm text-slate-400 uppercase tracking-widest">Menü</span>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">"""

new_sidebar_menu = """          <div className="flex items-center justify-between p-4 md:hidden border-b border-white/5 mb-2">
            <span className="font-bold text-sm text-slate-400 uppercase tracking-widest">Menü</span>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Profil ve Şube Seçimi (Sidebar Üstü) */}
          {user && (
            <div className="px-4 py-4 mb-2 border-b border-white/5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden relative bg-slate-800">
                  <Image src={user.imageUrl} alt={user.fullName || "User"} fill className="object-cover" />
                </div>
                <div className="flex flex-col justify-center overflow-hidden">
                  <span className="font-label-md text-sm text-white font-bold truncate">{user.fullName || "Kullanıcı"}</span>
                  <span className="font-label-md text-[10px] text-slate-400 uppercase tracking-widest font-black mt-0.5">Kasiyer</span>
                </div>
              </div>
              <div>
                {isMultiBranch && activeBranchId && allBranches && (
                  <BranchSelector activeBranchId={activeBranchId} branches={allBranches} />
                )}
              </div>
            </div>
          )}
          
          <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">"""

content = content.replace(old_sidebar_menu, new_sidebar_menu)

# Eski alt profili kaldir/temizle: aslidna sadece logout birakip user profile divini silebiliriz.
old_bottom_profile = """          {/* Profil ve Çıkış */}
          {user && (
            <div className="p-4 border-t border-white/5 bg-slate-950/50">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden relative bg-slate-800 shrink-0">
                  <Image src={user.imageUrl} alt={user.fullName || "User"} fill className="object-cover" />
                </div>
                <div className="flex flex-col justify-center overflow-hidden">
                  <span className="text-sm font-bold text-white truncate">{user.fullName || "Kullanıcı"}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-0.5">Kasiyer</span>
                </div>
              </div>
              <button
                onClick={() => { setIsSidebarOpen(false); signOut(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors font-bold text-sm cursor-pointer"
              >
                <LogOut size={16} />
                Çıkış Yap
              </button>
            </div>
          )}"""

new_bottom_profile = """          {/* Çıkış Yap (Sadece Buton) */}
          {user && (
            <div className="p-4 border-t border-white/5 bg-slate-950/50">
              <button
                onClick={() => { setIsSidebarOpen(false); signOut(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors font-bold text-sm cursor-pointer"
              >
                <LogOut size={16} />
                Çıkış Yap
              </button>
            </div>
          )}"""

content = content.replace(old_bottom_profile, new_bottom_profile)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

