import nodemailer from "nodemailer";

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    const host = process.env.SMTP_HOST || "localhost";
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendBossInvitationEmail(to: string, inviteLink: string): Promise<void> {
    const from = process.env.SMTP_FROM || `"Aura Loyalty" <no-reply@auraloyalty.com>`;
    
    // Prestige v2 Design: Indigo/Cyan glow, dark theme, modern corporate layout.
    // Indigo: #4f46e5, Cyan: #06b6d4. Purple/Violet is strictly banned!
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Aura Loyalty Davetiyesi</title>
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
              <div class="logo">AURA LOYALTY</div>
            </div>
            <div class="content">
              <h1>Kurumsal Yönetici Daveti</h1>
              <p>Merhaba,</p>
              <p>Aura Loyalty sadakat puanı platformunda şirketiniz başarıyla oluşturuldu. Platformu yönetmeye başlamak ve kurulum adımlarını tamamlamak üzere davet edildiniz.</p>
              <p>Hesabınızı doğrulamak ve giriş yapmak için aşağıdaki butonu kullanarak kayıt sürecini tamamlayabilirsiniz:</p>
              <div class="cta-container">
                <a href="${inviteLink}" class="btn" target="_blank">Daveti Onayla ve Giriş Yap</a>
              </div>
              <p>Bu bağlantı güvenliğiniz için tek kullanımlıktır. Eğer bu daveti beklemiyorsanız, lütfen bu e-postayı dikkate almayın.</p>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} Aura Loyalty. Tüm hakları saklıdır.<br>
              Sorularınız için <a href="mailto:support@auraloyalty.com">support@auraloyalty.com</a> adresiyle iletişime geçebilirsiniz.
            </div>
          </div>
        </body>
      </html>
    `;

    await this.transporter.sendMail({
      from,
      to,
      subject: "Aura Loyalty - Kurumsal Davetiyeniz",
      html,
    });
  }
}

export const emailService = EmailService.getInstance();
