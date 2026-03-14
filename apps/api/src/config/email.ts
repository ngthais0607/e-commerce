import nodemailer, { Transporter } from 'nodemailer';
import { config } from './index.js';
import { log } from '../utils/logger.js';

let transporter: Transporter | null = null;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; path: string }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  message?: string;
  error?: string;
}

/**
 * Initialize email transporter
 */
export const initEmail = (): Transporter | null => {
  try {
    // Use SMTP if configured, otherwise use test account
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      log.info('Email transporter initialized with SMTP');
    } else if (config.nodeEnv === 'development') {
      // Use Ethereal Email for development/testing
      log.warn('SMTP not configured, email will not be sent in production');
      transporter = null;
    }

    return transporter;
  } catch (error) {
    log.error('Failed to initialize email transporter', error as Error);
    return null;
  }
};

/**
 * Get email transporter
 */
export const getEmailTransporter = (): Transporter | null => {
  if (!transporter) {
    return initEmail();
  }
  return transporter;
};

/**
 * Send email
 */
export const sendEmail = async (options: EmailOptions): Promise<EmailResult> => {
  const emailTransporter = getEmailTransporter();

  if (!emailTransporter) {
    log.warn('Email transporter not available, skipping email send', {
      to: options.to,
      subject: options.subject,
    });
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@ecommerce.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      ...(options.attachments && { attachments: options.attachments }),
    };

    const info = await emailTransporter.sendMail(mailOptions);
    log.info('Email sent successfully', {
      to: options.to,
      subject: options.subject,
      messageId: info.messageId,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    log.error('Failed to send email', error as Error, {
      to: options.to,
      subject: options.subject,
    });
    return { success: false, error: (error as Error).message };
  }
};

export default transporter;

