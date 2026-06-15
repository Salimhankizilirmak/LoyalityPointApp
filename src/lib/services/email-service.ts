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

  async sendMail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
    const from = `"Loyalty" <novexistech@gmail.com>`;
    await this.transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
  }
}

export const emailService = EmailService.getInstance();
