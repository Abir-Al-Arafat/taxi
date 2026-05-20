import nodemailer from "nodemailer";
import { env } from "../../config/env";

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.emailHostUser,
        pass: env.emailHostPass,
      },
    });
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: env.emailHostUser,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html ?? payload.text,
      });
    } catch (error) {
      console.error("Failed to send email", {
        to: payload.to,
        subject: payload.subject,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }
}
