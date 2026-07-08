import re

file_path = "src/lib/templates/email-templates.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

kvkk_html_employee = """            <div style="max-height: 120px; overflow-y: auto; background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; margin: 16px 20px 24px 20px; font-size: 11px; color: #9ca3af; text-align: left; line-height: 1.5;">
              <strong>KVKK Aydınlatma Metni Özeti:</strong><br/>
              6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca; sisteme kayıt olurken sağlamış olduğunuz <strong>Ad, Soyad, E-posta ve Telefon Numarası</strong> bilgileriniz ile sistem üzerinde gerçekleştireceğiniz <strong>sadakat işlemleri (puan kazanma, harcama vb. hareketler)</strong>, veri sorumlusu tarafından sadakat programının yürütülmesi, size özel kampanyaların sunulması ve üyelik sözleşmesinin gerekliliklerinin yerine getirilmesi amacıyla işlenmektedir. Bu verileriniz, yasal zorunluluklar haricinde üçüncü şahıslarla paylaşılmamaktadır. Sisteme dahil olarak bu verilerinizin işlenmesine açık rıza göstermiş sayılırsınız.
            </div>"""

kvkk_html_customer = """                  <div style="max-height: 120px; overflow-y: auto; background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; margin: 24px auto; font-size: 11px; color: #9ca3af; text-align: left; line-height: 1.5;">
                    <strong>KVKK Aydınlatma Metni Özeti:</strong><br/>
                    6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca; sisteme kayıt olurken sağlamış olduğunuz <strong>Ad, Soyad, E-posta ve Telefon Numarası</strong> bilgileriniz ile sistem üzerinde gerçekleştireceğiniz <strong>sadakat işlemleri (puan kazanma, harcama vb. hareketler)</strong>, veri sorumlusu tarafından sadakat programının yürütülmesi, size özel kampanyaların sunulması ve üyelik sözleşmesinin gerekliliklerinin yerine getirilmesi amacıyla işlenmektedir. Bu verileriniz, yasal zorunluluklar haricinde üçüncü şahıslarla paylaşılmamaktadır. Sisteme dahil olarak bu verilerinizin işlenmesine açık rıza göstermiş sayılırsınız.
                  </div>"""

# Update Employee
old_emp = """            <div style="font-size: 12px; color: #4b5563; text-align: center; margin: 16px 0 24px 0; line-height: 1.5; padding: 0 20px;">
              <strong>KVKK ve Aydınlatma Metni:</strong> Butona tıklayarak sisteme kayıt olduğunuzda, Okut Kazan platformu Kullanıcı Sözleşmesi ve KVKK Aydınlatma Metni şartlarını okuduğunuzu, sadakat programı kapsamında kişisel verilerinizin işlenmesine <strong>Açık Rıza</strong> verdiğinizi kabul etmiş sayılarsınız.
            </div>"""

content = content.replace(old_emp, kvkk_html_employee)

# Update Customer
old_cus = """              <tr>
                <td style="padding: 30px 40px; background-color: #181820; border-top: 1px solid #2a2a36; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #767283; line-height: 1.6;">
                    <strong>KVKK ve Aydınlatma Metni:</strong> Butona tıklayarak sisteme kayıt olduğunuzda, Okut Kazan platformu Kullanıcı Sözleşmesi ve KVKK Aydınlatma Metni şartlarını okuduğunuzu, sadakat programı kapsamında kişisel verilerinizin işlenmesine <strong>Açık Rıza</strong> verdiğinizi kabul etmiş sayılarsınız.
                  </p>
                </td>
              </tr>"""

new_cus = """              <tr>
                <td style="padding: 20px 40px; background-color: #181820; border-top: 1px solid #2a2a36;">
""" + kvkk_html_customer + """
                </td>
              </tr>"""

content = content.replace(old_cus, new_cus)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
