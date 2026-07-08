"use client";

import { useState, use } from "react";
import { submitCustomerRegistration } from "../actions";

export default function RegisterPage({ params }: { params: Promise<{ registrationCode: string }> }) {
  const resolvedParams = use(params);
  const registrationCode = resolvedParams.registrationCode;
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [kvkkAccepted, setKvkkAccepted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const result = await submitCustomerRegistration(registrationCode, formData);
      if (result?.error) {
        setStatus("error");
        setMessage(result.error);
      } else {
        setStatus("success");
        setMessage("Kayıt talebiniz alındı. Mağaza onayı sonrası giriş yapabileceksiniz.");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Talep Alındı</h2>
          <p className="text-slate-600 mb-6">{message}</p>
          <a href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Müşteri Kaydı</h1>
          <p className="text-slate-500 mt-2">Mağazanın sadakat programına katılmak için formu doldurun.</p>
        </div>

        {status === "error" && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon (5XXXXXXXXX)</label>
            <input
              type="tel"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
            <input
              type="password"
              required
              minLength={8}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="pt-2">
            <div className="max-h-32 overflow-y-auto bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 mb-3 shadow-inner">
              <strong className="text-slate-800">KVKK Aydınlatma Metni Özeti:</strong><br/>
              6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca; sisteme kayıt olurken sağlamış olduğunuz <strong className="text-slate-700">Ad, Soyad, E-posta ve Telefon Numarası</strong> bilgileriniz ile sistem üzerinde gerçekleştireceğiniz <strong className="text-slate-700">sadakat işlemleri (puan kazanma, harcama vb. hareketler)</strong>, veri sorumlusu tarafından sadakat programının yürütülmesi, size özel kampanyaların sunulması ve üyelik sözleşmesinin gerekliliklerinin yerine getirilmesi amacıyla işlenmektedir. Bu verileriniz, yasal zorunluluklar haricinde üçüncü şahıslarla paylaşılmamaktadır. Sisteme dahil olarak bu verilerinizin işlenmesine açık rıza göstermiş sayılırsınız.
            </div>
            
            <label className="flex items-start gap-2.5 cursor-pointer group mb-4">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  type="checkbox"
                  required
                  checked={kvkkAccepted}
                  onChange={(e) => setKvkkAccepted(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors leading-snug">
                KVKK Aydınlatma Metnini okudum, anladım ve kişisel verilerimin belirtilen şartlarda işlenmesini kabul ediyorum.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !kvkkAccepted}
            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Gönderiliyor..." : "Kayıt Ol"}
          </button>
        </form>
      </div>
    </div>
  );
}
