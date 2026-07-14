import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  connectionTimeout: 5_000,
  greetingTimeout: 5_000,
  socketTimeout: 10_000,
});

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } catch (err) {
    console.error('Email send failed:', err instanceof Error ? err.message : err);
  }
}

/** Fire-and-forget — never block request handlers on SMTP. */
export function sendMailBackground(options: {
  to: string;
  subject: string;
  html: string;
}): void {
  void sendMail(options);
}
