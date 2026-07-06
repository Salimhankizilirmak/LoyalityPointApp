/**
 * Email templates for Okut Kazan Platform.
 * Follows the Prestige v2 design system: Indigo (#4f46e5) & Cyan (#06b6d4) theme.
 * All purple (#8083ff) tones are removed/replaced.
 */

export function getBossInvitationTemplate(inviteLink: string, companyName: string): string {
  return `
    <div style="background-color: #0a0a0a; color: #d4d4d4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; text-align: center;">
      <div style="max-width: 550px; margin: 0 auto; background-color: #171717; border: 1px solid #262626; border-radius: 24px; padding: 40px; text-align: left;">
        
        <h2 style="color: #ffffff; font-size: 24px; font-weight: 900; margin-top: 0; margin-bottom: 4px; letter-spacing: -0.05em;">Topla Kazan</h2>
        <p style="color: #737373; font-size: 11px; margin-top: 0; margin-bottom: 24px; font-style: italic;">
          "Müşteriniz toplasın, işletmeniz kazansın: Topla Kazan!"
        </p>
        
        <hr style="border: 0; border-top: 1px solid #262626; margin-bottom: 24px;" />
        
        <p style="color: #e5e5e5; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
          Merhaba,
        </p>
        <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          <strong>${companyName}</strong> bünyesinde <strong>Firma Sahibi (Patron)</strong> olarak kurumsal hesap aktivasyonunuzu tamamlamanız ve şube yönetim yetkilerinizi devralmanız için idari bir davet oluşturulmuştur.
        </p>
        
        <div style="text-align: center; margin-top: 28px; margin-bottom: 28px;">
          <a href="${inviteLink}" style="background-color: #6366f1; color: #ffffff; font-weight: bold; font-size: 12px; text-decoration: none; padding: 14px 32px; border-radius: 12px; display: inline-block; letter-spacing: 1px; text-transform: uppercase;">
            Hesabı Aktif Et ve Başla
          </a>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #262626; margin-top: 24px; margin-bottom: 16px;" />
        
        <p style="color: #737373; font-size: 11px; line-height: 1.6; margin-bottom: 0;">
          * Bu davetiyeyi kullanarak sisteme kayıt olmanız, kurumsal üyelik sözleşmesini ve veri sorumlusu beyanlarını onayladığınız anlamına gelmektedir. 
          <br />
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://loyality-point-app.vercel.app"}/kvkk" target="_blank" style="color: #6366f1; text-decoration: underline; font-weight: bold;">KVKK metnini okumak için tıklayınız.</a>
        </p>
        
      </div>
    </div>
  `;
}

export function getEmployeeInvitationTemplate(inviteLink: string, role: "manager" | "cashier", branchName: string): string {
  const currentYear = new Date().getFullYear();
  const roleLabel = role === "manager" ? "Şube Yöneticisi" : "Şube Kasiyeri";
  const headerText = role === "manager" ? `${branchName} Yönetici Daveti` : `${branchName} Kasiyer Daveti`;
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Okut Kazan Personel Davetiyesi</title>
        <style>
          body {
            background-color: #0b0f19;
            color: #f3f4f6;
            font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #111827;
            border: 1px solid #1f2937;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
          }
          .header {
            padding: 40px 40px 20px 40px;
            text-align: center;
            position: relative;
          }
          .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 10%;
            right: 10%;
            height: 1px;
            background: linear-gradient(90deg, transparent, #06b6d4, #4f46e5, transparent);
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
            margin: 0;
            background: linear-gradient(135deg, #06b6d4 0%, #4f46e5 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            color: #06b6d4;
          }
          .content {
            padding: 40px;
            line-height: 1.6;
          }
          h1 {
            font-size: 22px;
            font-weight: 700;
            color: #ffffff;
            margin-top: 0;
            margin-bottom: 20px;
            text-align: center;
          }
          p {
            color: #9ca3af;
            font-size: 16px;
            margin-bottom: 24px;
          }
          .info-box {
            background-color: rgba(6, 182, 212, 0.05);
            border: 1px solid rgba(6, 182, 212, 0.15);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
          }
          .info-item {
            margin-bottom: 8px;
            font-size: 15px;
          }
          .info-item:last-child {
            margin-bottom: 0;
          }
          .info-label {
            color: #06b6d4;
            font-weight: 600;
          }
          .info-value {
            color: #ffffff;
            font-weight: bold;
          }
          .cta-container {
            text-align: center;
            margin: 32px 0;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #06b6d4 0%, #4f46e5 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            font-weight: 600;
            font-size: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 14px 0 rgba(6, 182, 212, 0.3);
            transition: all 0.2s ease;
          }
          .footer {
            padding: 24px 40px;
            background-color: #0b0f19;
            text-align: center;
            font-size: 12px;
            color: #4b5563;
            border-top: 1px solid #1f2937;
          }
          .footer a {
            color: #06b6d4;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">OKUT KAZAN</div>
          </div>
          <div class="content">
            <h1>${headerText}</h1>
            <p>Merhaba,</p>
            <p>Okut Kazan sadakat puanı platformunda şube personeli olarak görev almanız için bir davet aldınız.</p>
            
            <div class="info-box">
              <div class="info-item">
                <span class="info-label">Davet Edilen Rol:</span>
                <span class="info-value">${roleLabel}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Atanacak Şube:</span>
                <span class="info-value">${branchName}</span>
              </div>
            </div>

            <p>Platforma katılarak görevinize başlamak ve kayıt sürecini tamamlamak için aşağıdaki butonu kullanabilirsiniz:</p>
            <div class="cta-container">
              <a href="${inviteLink}" class="btn" target="_blank">Daveti Onayla ve Kayıt Ol</a>
            </div>
            <div style="font-size: 12px; color: #4b5563; text-align: center; margin: 16px 0 24px 0; line-height: 1.5; padding: 0 20px;">
              <strong>KVKK ve Aydınlatma Metni:</strong> Butona tıklayarak sisteme kayıt olduğunuzda, Okut Kazan platformu Kullanıcı Sözleşmesi ve KVKK Aydınlatma Metni şartlarını okuduğunuzu, sadakat programı kapsamında kişisel verilerinizin işlenmesine <strong>Açık Rıza</strong> verdiğinizi kabul etmiş sayılarsınız.
            </div>
            <p>Bu bağlantı güvenliğiniz için tek kullanımlıktır. Eğer bu daveti beklemiyorsanız, lütfen bu e-postayı dikkate almayın.</p>
          </div>
          <div class="footer">
            © ${currentYear} Okut Kazan. Tüm hakları saklıdır.<br>
            Sorularınız için <a href="mailto:novexistech@gmail.com">novexistech@gmail.com</a> adresiyle iletişime geçebilirsiniz.
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getCustomerInvitationTemplate(inviteLink: string, customerName: string, organizationName: string, branchName?: string): string {
  const locationText = branchName ? `${organizationName} - ${branchName}` : organizationName;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sadakat Programı Daveti</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #13131b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e1ed;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #13131b; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 600px; background-color: #1c1c24; border-radius: 12px; border: 1px solid #2a2a36; overflow: hidden;" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.05em;">Özel Müşteri Daveti</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px 30px 40px; text-align: left; line-height: 1.6;">
                  <p style="margin: 0 0 16px 0; font-size: 16px; color: #ffffff;">Sayın <strong>${customerName}</strong>,</p>
                  <p style="margin: 0 0 24px 0; font-size: 15px; color: #b5b2bc;">
                    <strong>${locationText}</strong> sadakat programına davet edildiniz! Gerçekleştireceğiniz harcamalardan anında ödül puanları kazanmak, biriken puanlarınızı şubelerimizde harcamak ve size özel ayrıcalıklardan yararlanmak için profilinizi aktif hale getirebilirsiniz.
                  </p>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px auto;">
                    <tr>
                      <td align="center" style="border-radius: 8px;">
                        <a href="${inviteLink}" target="_blank" style="padding: 14px 32px; display: inline-block; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; background: linear-gradient(135deg, #06b6d4 0%, #4f46e5 100%); border-radius: 8px; box-shadow: 0 4px 14px 0 rgba(6, 182, 212, 0.3);">
                          Daveti Kabul Et & Başla
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px 40px; background-color: #181820; border-top: 1px solid #2a2a36; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #767283; line-height: 1.6;">
                    <strong>KVKK ve Aydınlatma Metni:</strong> Butona tıklayarak sisteme kayıt olduğunuzda, Okut Kazan platformu Kullanıcı Sözleşmesi ve KVKK Aydınlatma Metni şartlarını okuduğunuzu, sadakat programı kapsamında kişisel verilerinizin işlenmesine <strong>Açık Rıza</strong> verdiğinizi kabul etmiş sayılarsınız.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
