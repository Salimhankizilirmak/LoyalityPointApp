"use client";

import { useState } from "react";
import { deleteStaffMemberAction, updateStaffNameAction } from "@/app/actions/staff-management";
import { updateInvitationEmailAction } from "@/app/actions/invitation-actions";
import { Trash2, Edit2, ShieldAlert, BadgeCheck, Loader2, Check, X } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useRouter } from "next/navigation";

export function BossTeamClient({ initialMembers }: { initialMembers: any[] }) {
  const [members, setMembers] = useState(initialMembers || []);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const router = useRouter();


  const handleSaveName = async (member: any) => {
    if (editValue.trim() !== "" && editValue.trim() !== member.name) {
      setLoadingId(`edit-${member.id}`);
      const res = await updateStaffNameAction(member.id, editValue.trim());
      if (res && !res.success) {
        alert(res.error || "İsim güncellenirken hata oluştu.");
      } else {
        setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, name: editValue.trim() } : m));
        router.refresh();
      }
      setLoadingId(null);
    }
    setEditingMemberId(null);
  };

  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editEmailValue, setEditEmailValue] = useState("");

  const handleEditEmailSave = async (id: string) => {
    if (!editEmailValue.trim() || !editEmailValue.includes("@")) {
       alert("Lütfen geçerli bir e-posta adresi girin.");
       return;
    }
    setLoadingId(`edit-email-${id}`);
    
    try {
      // Sadece "inv-" ile başlayan (veya statüsü PENDING olan) davetler id'sini "inv-ID" formatında tutuyorsa id'yi parse etmeliyiz:
      const realId = id.startsWith("inv-") ? id.replace("inv-", "") : id;
      const res = await updateInvitationEmailAction(realId, editEmailValue);
      if (res.success) {
        setMembers(prev => prev.map(m => m.id === id ? { ...m, email: editEmailValue.trim() } : m));
        router.refresh();
      } else {
        alert("E-posta güncellenemedi: " + (res.error || "Bilinmeyen hata"));
      }
    } catch (err) {
      alert("Hata oluştu.");
    } finally {
      setLoadingId(null);
      setEditingEmailId(null);
    }
  };


  const handleDelete = async (id: string, role: string) => {
    if (!confirm(`Bu ${role === "manager" ? "Yöneticiyi" : "Kasiyeri"} sistemden tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) return;
    
    setLoadingId(id);
    const apiRole = role.toLowerCase() === "manager" ? "MANAGER" : "CASHIER";
    const res = await deleteStaffMemberAction(id, apiRole);
    
    if (res && !res.success) {
      alert(res.error || "Silinirken bir hata oluştu.");
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      router.refresh();
    }
    setLoadingId(null);
  };

  // PENDING ve ACTIVE hepsi burada
  const validMembers = members;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="mb-8 text-center md:text-left">
        <h2 className="text-2xl md:text-3xl font-black text-white flex items-center justify-center md:justify-start gap-3">
          <ShieldAlert className="w-7 h-7 text-indigo-400" />
          Ekibim (Yöneticiler ve Kasiyerler)
        </h2>
        <p className="text-slate-400 mt-2">
          Tüm şubelerinizdeki yöneticileri ve kasiyerleri buradan görebilir, yönetebilir ve kalıcı olarak silebilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {validMembers.map((member) => (
          <GlassPanel key={member.id} className="p-6 relative flex flex-col group hover:border-indigo-500/50 transition-colors duration-300">
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={() => { setEditingMemberId(member.id); setEditValue(member.name || ""); }}
                disabled={loadingId === `edit-${member.id}`}
                className="p-2 bg-slate-800 hover:bg-indigo-500 hover:text-white rounded-lg transition-colors text-slate-400 disabled:opacity-50"
              >
                {loadingId === `edit-${member.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
              </button>
              <button 
                
                onClick={() => handleDelete(member.id, member.role)}
                disabled={loadingId === member.id}
                className="p-2 bg-slate-800 hover:bg-rose-500 hover:text-white rounded-lg transition-colors text-rose-400 disabled:opacity-50"
              >
                {loadingId === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="flex flex-col items-center mt-2 mb-4 text-center">
               <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center font-black text-2xl text-slate-300 mb-3 shadow-inner ring-4 ring-slate-900">
                 {member.name ? member.name.substring(0, 2).toUpperCase() : "?"}
               </div>
               {editingMemberId === member.id ? (
                 <div className="flex items-center justify-center gap-1 mb-2 px-2">
                   <input
                     type="text"
                     autoFocus
                     value={editValue}
                     onChange={(e) => setEditValue(e.target.value)}
                     disabled={loadingId === `edit-${member.id}`}
                     onKeyDown={(e) => {
                       if (e.key === "Enter") handleSaveName(member);
                       if (e.key === "Escape") setEditingMemberId(null);
                     }}
                     className="w-32 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-center text-white focus:outline-none focus:border-cyan-500"
                   />
                   <button onClick={() => handleSaveName(member)} disabled={loadingId === `edit-${member.id}`} className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30">
                     <Check size={16} />
                   </button>
                   <button onClick={() => setEditingMemberId(null)} disabled={loadingId === `edit-${member.id}`} className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">
                     <X size={16} />
                   </button>
                 </div>
               ) : (
                 <h3 className="text-lg font-bold text-white leading-tight mb-2 px-4">
                   {member.name || `İsimsiz ${(member.role || '').toLowerCase() === 'manager' ? 'Yönetici' : 'Kasiyer'}`}
                 </h3>
               )}
               <div className="flex items-center gap-2 justify-center">
                   <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${(member.role || '').toLowerCase() === 'manager' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                     {(member.role || '').toLowerCase() === 'manager' ? 'Yönetici' : 'Kasiyer'}
                   </span>
                   {member.status === "active" || member.status === "ACCEPTED" ? (
                      <BadgeCheck className="w-5 h-5 text-emerald-400"  />
                   ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 whitespace-nowrap">Bekliyor</span>
                   )}
               </div>
            </div>
            
            <div className="space-y-3 mt-auto w-full pt-4 border-t border-white/5">
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2 relative group/email">
                <span className="text-slate-500 font-semibold text-xs uppercase">E-posta</span>
                {editingEmailId === member.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      type="email"
                      value={editEmailValue}
                      onChange={(e) => setEditEmailValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEditEmailSave(member.id);
                        if (e.key === "Escape") setEditingEmailId(null);
                      }}
                      className="w-32 bg-slate-900 border border-slate-700 rounded px-1 text-[11px] py-0.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button onClick={() => handleEditEmailSave(member.id)} disabled={loadingId === `edit-email-${member.id}`} className="text-emerald-400 hover:text-emerald-300">
                       {loadingId === `edit-email-${member.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check size={12} />}
                    </button>
                    <button onClick={() => setEditingEmailId(null)} disabled={loadingId === `edit-email-${member.id}`} className="text-rose-400 hover:text-rose-300">
                       <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-slate-300 truncate max-w-[150px]" title={member.email}>{member.email}</span>
                    {member.id.startsWith("inv-") && (
                       <button
                         onClick={() => { setEditingEmailId(member.id); setEditEmailValue(member.email || ""); }}
                         className="opacity-0 group-hover/email:opacity-100 p-0.5 rounded text-slate-400 hover:text-indigo-400 transition"
                         title="E-postayı Düzenle"
                       >
                         <Edit2 size={10} />
                       </button>
                    )}
                  </div>
                )}
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
            </div>
          </GlassPanel>
        ))}

        {validMembers.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            Organizasyonunuzda henüz kayıtlı yönetici veya kasiyer bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
}
