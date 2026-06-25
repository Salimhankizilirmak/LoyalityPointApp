import Link from "next/link";
import { Shield, Database, CloudLightning, ArrowLeft, Lock } from "lucide-react";

export const metadata = {
  robots: "noindex, nofollow",
};

export default function KVKKPage() {
  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-300 py-20 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden">
      {/* Premium Ambient Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-indigo-500/10 via-cyan-500/5 to-transparent blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-3xl mx-auto relative">
        {/* Back to App Button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors duration-200 mb-8 group bg-neutral-900/80 border border-white/5 px-4 py-2 rounded-full hover:border-white/10"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
          Ana Sayfaya Dön
        </Link>

        {/* Main Card Container */}
        <div className="bg-neutral-900/60 rounded-3xl p-8 sm:p-12 border border-white/5 shadow-2xl backdrop-blur-xl relative">
          {/* Subtle Decorative Top Glow Border */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

          {/* Header Section */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium mb-6">
              <Shield size={12} className="text-indigo-400" />
              KVKK Bilgilendirmesi
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
              Topla Kazan — KVKK Aydınlatma Metni
            </h1>
            <p className="text-xs text-neutral-500 mt-2">Son Güncelleme: 25 Haziran 2026</p>
          </div>

          {/* Content Body */}
          <div className="space-y-8 text-sm leading-relaxed text-neutral-400">
            <div className="bg-neutral-950/40 rounded-2xl p-5 border border-white/5 text-neutral-300">
              <p>
                <strong>Topla Kazan</strong> olarak, platformumuz üzerindeki kişisel verilerinizin güvenliğine ve hukuka uygun olarak işlenmesine büyük önem veriyoruz. 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca, veri sorumlusu sıfatıyla hareket etmekteyiz.
              </p>
            </div>

            {/* Section 1 */}
            <div className="group relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:border-cyan-500/40 transition-colors duration-300">
                  <Database size={18} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors duration-200">
                    1. İşlenen Kişisel Verileriniz ve İşleme Amaçları
                  </h2>
                  <p>
                    Sistemimize kurumsal davet veya kayıt yoluyla katılımınız esnasında sağladığınız <strong>Telefon Numarası</strong> ve <strong>E-Posta Adresi</strong> verileriniz; b2b sadakat programı süreçlerinin yürütülmesi, multi-tenant (çoklu kiracılı) şube yönetim yetkilendirilmelerinin ve hiyerarşisinin kurulması ile platform üzerinde benzersiz kullanıcı kimliğinizin (username) doğrulanması amaçlarıyla sınırlı olarak işlenmektedir.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="group relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/20 flex items-center justify-center text-cyan-400 group-hover:border-indigo-500/40 transition-colors duration-300">
                  <CloudLightning size={18} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors duration-200">
                    2. Verilerin Aktarılması ve Muhafazası
                  </h2>
                  <p>
                    Kişisel verileriniz, kimlik doğrulama altyapımızın küresel standartlarda sağlanması amacıyla şifreli olarak Clerk (clerk.com) sistemlerinde ve projenin yerel güvenli veritabanı loglama süreçleri kapsamında strictly muhafaza edilmektedir. Verileriniz üçüncü şahıslara veya reklam ağlarına asla aktarılmamakta ve ticari amaçlarla satılmamaktadır.
                  </p>
                </div>
              </div>
            </div>

            {/* Disclaimer Footer */}
            <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs text-neutral-500 max-w-md">
                Bu metin, kurumsal katılım davetini e-posta üzerinden onaylayıp sisteme ilk kaydınızı gerçekleştirdiğiniz andan itibaren strictly kabul edilmiş sayılır.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-neutral-500 bg-neutral-950/60 px-3 py-1.5 rounded-lg border border-white/5 self-start sm:self-auto">
                <Lock size={10} className="text-emerald-500" />
                <span>SSL Secured</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
