import re

file_path = "src/app/(boss)/boss-dashboard/team/client-page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Eski mapping'i alıp degistiriyoruz
old_card = """            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-lg text-slate-300">
                 {member.name ? member.name.substring(0, 2).toUpperCase() : "?"}
               </div>
               <div>
                  <h3 className="text-lg font-bold text-white leading-tight pr-16 truncate w-32">{member.name || "İsimsiz"}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${member.role === 'manager' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                       {member.role === 'manager' ? 'Yönetici' : 'Kasiyer'}
                     </span>
                     {member.status === "active" && (
                        <BadgeCheck className="w-4 h-4 text-emerald-400" />
                     )}
                  </div>
               </div>
            </div>
            
            <p className="text-slate-300 text-sm mb-2 truncate" title={member.email}>{member.email}</p>
            {member.branchName && (
               <div className="mt-auto pt-4 border-t border-white/5 text-xs text-slate-400">
                 <span className="font-medium text-slate-300">Şube: </span> {member.branchName}
               </div>
            )}"""

new_card = """            <div className="flex flex-col items-center mt-2 mb-4 text-center">
               <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center font-black text-2xl text-slate-300 mb-3 shadow-inner ring-4 ring-slate-900">
                 {member.name ? member.name.substring(0, 2).toUpperCase() : "?"}
               </div>
               <h3 className="text-lg font-bold text-white leading-tight mb-2 px-4">{member.name || "İsimsiz"}</h3>
               <div className="flex items-center gap-2 justify-center">
                   <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${member.role === 'manager' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                     {member.role === 'manager' ? 'Yönetici' : 'Kasiyer'}
                   </span>
                   {member.status === "active" && (
                      <BadgeCheck className="w-5 h-5 text-emerald-400" title="Aktif Kullanıcı" />
                   )}
               </div>
            </div>
            
            <div className="space-y-3 mt-auto w-full pt-4 border-t border-white/5">
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-slate-500 font-semibold text-xs uppercase">E-posta</span>
                <span className="text-slate-300 truncate max-w-[150px]" title={member.email}>{member.email}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-slate-500 font-semibold text-xs uppercase">Telefon</span>
                <span className="text-slate-300">{member.phone || "Belirtilmemiş"}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-slate-500 font-semibold text-xs uppercase">Şube</span>
                <span className="text-slate-300 truncate max-w-[150px]">{member.branchName || member.branch || "Belirtilmemiş"}</span>
              </div>
              <div className="flex justify-between items-center text-sm pb-1">
                <span className="text-slate-500 font-semibold text-xs uppercase">Katılım</span>
                <span className="text-slate-300">
                  {member.createdAt 
                    ? new Date(member.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" }) 
                    : "Bilinmiyor"}
                </span>
              </div>
            </div>"""

content = content.replace(old_card, new_card)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
