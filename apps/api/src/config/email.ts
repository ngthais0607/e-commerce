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

/** Build a fresh transporter — called both on init and after connection failures */
const createTransporter = (): Transporter => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Connection pool — reuses connections instead of opening a new one per email
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    // Keepalive: ping the server every 60 s so the connection doesn't idle-timeout
    socketTimeout: 30000,
    greetingTimeout: 15000,
    connectionTimeout: 15000,
    tls: {
      // Needed for some hosting environments; remove if your cert is fully trusted
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
};

/**
 * Initialize email transporter
 */
export const initEmail = (): Transporter | null => {
  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = createTransporter();
      log.info('Email transporter initialized with SMTP');
    } else {
      log.warn('SMTP not configured — emails will not be sent');
      transporter = null;
    }
    return transporter;
  } catch (error) {
    log.error('Failed to initialize email transporter', error as Error);
    return null;
  }
};

/**
 * Get email transporter, initializing if needed
 */
export const getEmailTransporter = (): Transporter | null => {
  if (!transporter) {
    return initEmail();
  }
  return transporter;
};

/**
 * Send email with automatic retry on connection errors
 */
export const sendEmail = async (options: EmailOptions): Promise<EmailResult> => {
  const MAX_RETRIES = 2;

  const attempt = async (retryCount: number): Promise<EmailResult> => {
    const emailTransporter = getEmailTransporter();

    if (!emailTransporter) {
      log.warn('Email transporter not available, skipping email send', {
        to: options.to,
        subject: options.subject,
      });
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const info = await emailTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@ecommerce.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        ...(options.attachments && { attachments: options.attachments }),
      });

      log.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      const err = error as Error & { code?: string };
      const isConnectionError = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ESOCKET'].includes(err.code ?? '');

      if (isConnectionError && retryCount < MAX_RETRIES) {
        log.warn(`Email connection error (${err.code}), resetting transporter and retrying (${retryCount + 1}/${MAX_RETRIES})…`);
        // Reset stale transporter so the next attempt creates a fresh connection
        if (transporter) {
          try { (transporter as Transporter & { close?: () => void }).close?.(); } catch { /* ignore */ }
        }
        transporter = null;
        // Small back-off before retry
        await new Promise((r) => setTimeout(r, 500 * (retryCount + 1)));
        return attempt(retryCount + 1);
      }

      log.error('Failed to send email', err, { to: options.to, subject: options.subject });
      return { success: false, error: err.message };
    }
  };

  return attempt(0);
};

export default transporter;

