import re

file_path = "src/app/register/[registrationCode]/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. State ekleme
if "const [kvkkAccepted" not in content:
    content = content.replace("const [message, setMessage] = useState(\"\");", 
                              "const [message, setMessage] = useState(\"\");\n  const [kvkkAccepted, setKvkkAccepted] = useState(false);")

# 2. Checkbox ekleme (Button'dan hemen önce)
old_btn = """          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
          >
            {loading ? "Gönderiliyor..." : "Kayıt Ol"}
          </button>"""

new_btn = """          <div className="pt-2">
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
          </button>"""

content = content.replace(old_btn, new_btn)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
