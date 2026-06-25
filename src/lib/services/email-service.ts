import nodemailer from "nodemailer";

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter | null = null;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = process.env.SMTP_HOST;
    const portStr = process.env.SMTP_PORT || "587";
    const port = parseInt(portStr, 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

    if (!host || !user) {
      const errorMsg = "❌ [SMTP_CONFIG_ERROR]: SMTP configuration is missing in environment variables (SMTP_HOST or SMTP_USER is undefined).";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: user && pass ? { user, pass } : undefined,
      connectionTimeout: 5000,
      tls: {
        rejectUnauthorized: false,
      },
    });

    return this.transporter;
  }

  async sendMail({ to, subject, html, text }: { to: string; subject: string; html: string; text?: string }): Promise<void> {
    const transporter = this.getTransporter();
    const fromUser = process.env.SMTP_USER;
    
    await transporter.sendMail({
      from: `"Topla Kazan" <${fromUser}>`,
      to,
      subject,
      html,
      text,
    });
  }
}

export const emailService = EmailService.getInstance();
