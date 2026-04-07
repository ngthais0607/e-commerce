import { sendEmail } from '../config/email.js';

/** Minimal types for email payloads */
interface OrderLike {
  orderNumber?: string;
  createdAt?: string | Date;
  status?: string;
  items?: Array<{ name?: string; quantity?: number; price?: unknown }>;
  subtotal?: unknown;
  shippingFee?: number;
  discount?: unknown;
  total?: unknown;
  trackingCode?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  user?: UserLike | null;
  email?: string;
  shippingAddress?: { name?: string };
}

interface UserLike {
  id?: number;
  name?: string;
  email?: string;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

const fmt = (amount: unknown) => `$${Number(amount).toFixed(2)}`;

const year = () => new Date().getFullYear();

const fmtDate = (date?: string | Date) =>
  date ? new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

/** Base HTML wrapper — consistent brand shell for all emails */
const baseHtml = (title: string, previewText: string, body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${title}</title>
  <!--[if mso]><style>td,th,div,p,a,h1,h2,h3,h4,h5,h6{font-family:Arial,sans-serif;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f0f7ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f0f7ff;min-width:100%;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(14,165,233,0.10);">

          <!-- Gradient header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0284c7 0%,#0ea5e9 60%,#38bdf8 100%);padding:36px 40px 32px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <span style="display:inline-block;background:rgba(255,255,255,0.20);border-radius:12px;padding:8px 20px;">
                      <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">STAY</span>
                    </span>
                  </td>
                </tr>
              </table>
              ${body.split('<!--HEADER_CONTENT-->')[1]?.split('<!--/HEADER_CONTENT-->')[0] ?? ''}
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              ${body.split('<!--BODY-->')[1]?.split('<!--/BODY-->')[0] ?? ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e0f0fb;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#64748b;">
                Thank you for shopping with <strong style="color:#0ea5e9;">Stay</strong>
              </p>
              <p style="margin:0;font-size:11px;color:#94a3b8;">© ${year()} Stay. All rights reserved.</p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
</body>
</html>`;

/** Renders product rows in the order items table */
const itemRows = (items: OrderLike['items']) =>
  (items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
          <span style="font-size:14px;color:#1e293b;font-weight:500;">${item.name ?? ''}</span>
          <span style="display:inline-block;margin-left:8px;background:#f0f9ff;color:#0ea5e9;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;">x${item.quantity}</span>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid #f1f5f9;text-align:right;vertical-align:top;">
          <span style="font-size:14px;font-weight:600;color:#0f172a;">${fmt(Number(item.price) * (item.quantity ?? 0))}</span>
        </td>
      </tr>`,
    )
    .join('');

/** Renders the pricing summary block */
const priceSummary = (order: OrderLike) => `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:4px;">
    <tr>
      <td style="padding:6px 0;font-size:13px;color:#64748b;">Subtotal</td>
      <td style="padding:6px 0;font-size:13px;color:#334155;text-align:right;">${fmt(order.subtotal)}</td>
    </tr>
    ${(order.shippingFee ?? 0) > 0 ? `
    <tr>
      <td style="padding:6px 0;font-size:13px;color:#64748b;">Shipping</td>
      <td style="padding:6px 0;font-size:13px;color:#334155;text-align:right;">${fmt(order.shippingFee)}</td>
    </tr>` : ''}
    ${Number(order.discount ?? 0) > 0 ? `
    <tr>
      <td style="padding:6px 0;font-size:13px;color:#64748b;">Discount</td>
      <td style="padding:6px 0;font-size:13px;color:#22c55e;text-align:right;">− ${fmt(order.discount)}</td>
    </tr>` : ''}
    <tr>
      <td colspan="2" style="padding:0;">
        <div style="border-top:2px dashed #e0f0fb;margin:10px 0;"></div>
      </td>
    </tr>
    <tr>
      <td style="padding:6px 0;font-size:16px;font-weight:700;color:#0f172a;">Total</td>
      <td style="padding:6px 0;font-size:18px;font-weight:800;color:#0ea5e9;text-align:right;">${fmt(order.total)}</td>
    </tr>
  </table>`;

/** Colored status badge */
const statusBadge = (status: string) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    PENDING:    { bg: '#fef3c7', color: '#d97706', label: 'Pending'    },
    CONFIRMED:  { bg: '#dbeafe', color: '#2563eb', label: 'Confirmed'  },
    PROCESSING: { bg: '#ede9fe', color: '#7c3aed', label: 'Processing' },
    SHIPPED:    { bg: '#d1fae5', color: '#059669', label: 'Shipped'    },
    DELIVERED:  { bg: '#dcfce7', color: '#16a34a', label: 'Delivered'  },
    CANCELLED:  { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled'  },
    PAID:       { bg: '#dcfce7', color: '#16a34a', label: 'Paid'       },
  };
  const s = map[status?.toUpperCase()] ?? { bg: '#f1f5f9', color: '#475569', label: status };
  return `<span style="display:inline-block;background:${s.bg};color:${s.color};font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;">${s.label}</span>`;
};

// ─── Order Confirmation ───────────────────────────────────────────────────────

/**
 * Send order confirmation email
 */
export const sendOrderConfirmation = async (order: OrderLike, user: UserLike) => {
  const html = baseHtml(
    `Order Confirmation — #${order.orderNumber}`,
    `Your order #${order.orderNumber} has been received! We'll get it ready right away.`,
    `<!--HEADER_CONTENT-->
      <div style="width:64px;height:64px;background:rgba(255,255,255,0.25);border-radius:50%;margin:0 auto 16px;">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="30" fill="rgba(255,255,255,0.25)"/>
          <path d="M20 33l9 9 15-18" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Order Confirmed!</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);">Thanks for shopping with Stay ✨</p>
    <!--/HEADER_CONTENT-->
    <!--BODY-->
      <p style="margin:0 0 20px;font-size:15px;color:#334155;">Hi <strong style="color:#0f172a;">${user.name}</strong>,</p>
      <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;">
        We've received your order and it's being prepared. We'll notify you once it's on its way.
      </p>

      <!-- Order meta -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
             style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;margin-bottom:28px;">
        <tr>
          <td style="padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td width="50%" style="padding:6px 0;vertical-align:top;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Order Number</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#0ea5e9;">#${order.orderNumber}</p>
                </td>
                <td width="50%" style="padding:6px 0;vertical-align:top;text-align:right;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Status</p>
                  <p style="margin:0;">${statusBadge(order.status ?? 'PENDING')}</p>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:12px 0 0;">
                  <div style="border-top:1px solid #e2e8f0;"></div>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0 0;vertical-align:top;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Order Date</p>
                  <p style="margin:0;font-size:13px;color:#475569;">${fmtDate(order.createdAt)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Items -->
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Items Ordered</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
        ${itemRows(order.items)}
      </table>

      <!-- Price summary -->
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:14px;padding:20px 24px;margin-bottom:28px;">
        ${priceSummary(order)}
      </div>

      <!-- CTA button -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders"
               style="display:inline-block;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:100px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(14,165,233,0.35);">
              View My Order &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;text-align:center;line-height:1.6;">
        Questions? Reach out to our <strong>support team</strong> anytime.
      </p>
    <!--/BODY-->`,
  );

  const text = `
Order Confirmed — #${order.orderNumber}

Hi ${user.name},

We've received your order and it's being prepared.

Order #: ${order.orderNumber}
Date: ${fmtDate(order.createdAt)}
Status: ${order.status}

Items:
${(order.items || []).map((i) => `- ${i.name} x${i.quantity}: ${fmt(Number(i.price) * (i.quantity ?? 0))}`).join('\n')}

Subtotal: ${fmt(order.subtotal)}
${(order.shippingFee ?? 0) > 0 ? `Shipping: ${fmt(order.shippingFee)}\n` : ''}${Number(order.discount ?? 0) > 0 ? `Discount: -${fmt(order.discount)}\n` : ''}Total: ${fmt(order.total)}

View order: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders

© ${year()} Stay. All rights reserved.
  `.trim();

  return sendEmail({
    to: user.email ?? '',
    subject: `✅ Order Confirmed — #${order.orderNumber ?? ''}`,
    html,
    text,
  });
};

// ─── OTP Email ────────────────────────────────────────────────────────────────

/**
 * Send OTP email for password reset
 */
export const sendOtpEmail = async (user: UserLike, otp: string) => {
  const html = baseHtml(
    'Your Password Reset Code',
    `Your OTP is ${otp} — valid for 5 minutes.`,
    `<!--HEADER_CONTENT-->
      <div style="font-size:48px;margin-bottom:12px;">🔐</div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">Password Reset</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);">Use the code below to reset your password</p>
    <!--/HEADER_CONTENT-->
    <!--BODY-->
      <p style="margin:0 0 20px;font-size:15px;color:#334155;">Hi <strong style="color:#0f172a;">${user.name}</strong>,</p>
      <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;">
        We received a request to reset your password. Enter the OTP below to continue.
        This code is valid for <strong>5 minutes</strong>.
      </p>

      <!-- OTP Box -->
      <div style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border:2px solid #bae6fd;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;">Your OTP Code</p>
        <span style="font-size:42px;font-weight:900;letter-spacing:14px;color:#0284c7;font-family:'Courier New',monospace;">${otp}</span>
        <p style="margin:12px 0 0;font-size:12px;color:#64748b;">Expires in 5 minutes</p>
      </div>

      <!-- Warning -->
      <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
          ⚠️ <strong>Security tip:</strong> Never share this code with anyone. Stay will never ask for your OTP by phone or chat.
        </p>
      </div>

      <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
        If you didn't request this, you can safely ignore this email.
      </p>
    <!--/BODY-->`,
  );

  const text = `
Password Reset — Stay

Hi ${user.name},

Your OTP code is: ${otp}

Valid for 5 minutes. Never share this code with anyone.

If you didn't request this, please ignore this email.

© ${year()} Stay. All rights reserved.
  `.trim();

  return sendEmail({
    to: user.email ?? '',
    subject: `🔐 Your password reset code — Stay`,
    html,
    text,
  });
};

// ─── Password Reset (link-based fallback) ────────────────────────────────────

/**
 * Send password reset email (link-based, legacy fallback when Redis is unavailable)
 */
export const sendPasswordReset = async (user: UserLike, resetToken: string) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/forgot-password?token=${resetToken}`;

  const html = baseHtml(
    'Reset Your Password',
    'Click the button to reset your Stay account password.',
    `<!--HEADER_CONTENT-->
      <div style="font-size:48px;margin-bottom:12px;">🔑</div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">Reset Your Password</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);">We received a reset request for your account</p>
    <!--/HEADER_CONTENT-->
    <!--BODY-->
      <p style="margin:0 0 20px;font-size:15px;color:#334155;">Hi <strong style="color:#0f172a;">${user.name}</strong>,</p>
      <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;">
        Click the button below to reset your password. This link expires in <strong>1 hour</strong>.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
        <tr>
          <td align="center">
            <a href="${resetUrl}"
               style="display:inline-block;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:100px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(14,165,233,0.35);">
              Reset Password &rarr;
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;text-align:center;">Or copy this link into your browser:</p>
      <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;word-break:break-all;">${resetUrl}</p>
      <div style="border-top:1px solid #e2e8f0;margin:24px 0;"></div>
      <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
        If you didn't request this, you can safely ignore this email.
      </p>
    <!--/BODY-->`,
  );

  const text = `
Reset Your Password — Stay

Hi ${user.name},

Click the link below to reset your password (expires in 1 hour):
${resetUrl}

If you didn't request this, please ignore this email.

© ${year()} Stay. All rights reserved.
  `.trim();

  return sendEmail({
    to: user.email ?? '',
    subject: '🔑 Reset your Stay password',
    html,
    text,
  });
};

// ─── Order Status Update ──────────────────────────────────────────────────────

/**
 * Send order status update email
 */
export const sendOrderStatusUpdate = async (
  order: OrderLike,
  user: UserLike,
  _oldStatus: string,
  newStatus: string,
) => {
  const statusMeta: Record<string, { icon: string; title: string; desc: string }> = {
    CONFIRMED:  { icon: '✅', title: 'Order Confirmed',      desc: 'Your order has been confirmed and is being prepared.' },
    PROCESSING: { icon: '📦', title: 'Packing Your Order',   desc: 'Our team is carefully packing your items.' },
    SHIPPING:   { icon: '🚚', title: 'Your Order Is On Its Way', desc: 'Your order has been handed to our delivery partner.' },
    DELIVERED:  { icon: '🎉', title: 'Order Delivered!',     desc: 'Your order has been delivered. Enjoy your purchase!' },
    CANCELLED:  { icon: '❌', title: 'Order Cancelled',       desc: 'Your order has been cancelled as requested.' },
  };
  const meta = statusMeta[newStatus?.toUpperCase()] ?? {
    icon: '📋',
    title: `Status Updated: ${newStatus}`,
    desc: 'Your order status has been updated.',
  };

  const html = baseHtml(
    `Order Update — #${order.orderNumber}`,
    `${meta.title} — order #${order.orderNumber}`,
    `<!--HEADER_CONTENT-->
      <div style="font-size:48px;margin-bottom:12px;">${meta.icon}</div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;">${meta.title}</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);">${meta.desc}</p>
    <!--/HEADER_CONTENT-->
    <!--BODY-->
      <p style="margin:0 0 20px;font-size:15px;color:#334155;">Hi <strong style="color:#0f172a;">${user.name}</strong>,</p>

      <!-- Status card -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
             style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;margin-bottom:28px;">
        <tr>
          <td style="padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td width="50%" style="padding:6px 0;vertical-align:top;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Order Number</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#0ea5e9;">#${order.orderNumber}</p>
                </td>
                <td width="50%" style="padding:6px 0;vertical-align:top;text-align:right;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">New Status</p>
                  <p style="margin:0;">${statusBadge(newStatus)}</p>
                </td>
              </tr>
              ${order.trackingCode ? `
              <tr>
                <td colspan="2" style="padding:12px 0 0;">
                  <div style="border-top:1px solid #e2e8f0;padding-top:12px;">
                    <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Tracking Code</p>
                    <p style="margin:0;font-size:14px;font-weight:700;color:#334155;">${order.trackingCode}</p>
                  </div>
                </td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders"
               style="display:inline-block;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:100px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(14,165,233,0.35);">
              Track My Order &rarr;
            </a>
          </td>
        </tr>
      </table>
    <!--/BODY-->`,
  );

  return sendEmail({
    to: user.email ?? '',
    subject: `${meta.icon} ${meta.title} — #${order.orderNumber}`,
    html,
    text: `${meta.title}\n\nHi ${user.name},\n\n${meta.desc}\nOrder #${order.orderNumber}${order.trackingCode ? `\nTracking: ${order.trackingCode}` : ''}\n\n© ${year()} Stay.`,
  });
};

// ─── Order Shipped ────────────────────────────────────────────────────────────

/**
 * Send a dedicated "your order has shipped" email with tracking code highlighted
 */
export const sendOrderShipped = async (order: OrderLike, user: UserLike) => {
  const html = baseHtml(
    `Your Order #${order.orderNumber} Is On Its Way!`,
    `Great news! Your order #${order.orderNumber} has been shipped and is on its way to you.`,
    `<!--HEADER_CONTENT-->
      <div style="font-size:56px;margin-bottom:12px;">🚚</div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">Your Order Is On Its Way!</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);">Sit tight — your package is heading to you right now.</p>
    <!--/HEADER_CONTENT-->
    <!--BODY-->
      <p style="margin:0 0 20px;font-size:15px;color:#334155;">Hi <strong style="color:#0f172a;">${user.name}</strong>,</p>
      <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;">
        Exciting news! Your order has been handed off to our delivery partner and is now on its way to you.
      </p>

      <!-- Tracking highlight -->
      ${order.trackingCode ? `
      <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #86efac;border-radius:16px;padding:24px;text-align:center;margin-bottom:28px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:1.5px;">Tracking Code</p>
        <span style="font-size:28px;font-weight:900;letter-spacing:6px;color:#15803d;font-family:'Courier New',monospace;">${order.trackingCode}</span>
        <p style="margin:10px 0 0;font-size:12px;color:#4ade80;">Use this code to track your package with the delivery carrier.</p>
      </div>` : ''}

      <!-- Order details card -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
             style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;margin-bottom:28px;">
        <tr>
          <td style="padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td width="50%" style="padding:6px 0;vertical-align:top;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Order Number</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#0ea5e9;">#${order.orderNumber}</p>
                </td>
                <td width="50%" style="padding:6px 0;vertical-align:top;text-align:right;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Status</p>
                  <p style="margin:0;">${statusBadge('SHIPPED')}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Items summary -->
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Items In Your Shipment</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
        ${itemRows(order.items)}
      </table>

      <!-- Info box -->
      <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:28px;">
        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
          📬 <strong>Delivery tip:</strong> Make sure someone is available to receive the package. If you miss the delivery, check with your local carrier using the tracking code above.
        </p>
      </div>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders"
               style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:100px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(16,185,129,0.35);">
              Track My Order &rarr;
            </a>
          </td>
        </tr>
      </table>
    <!--/BODY-->`,
  );

  const text = `
Your Order #${order.orderNumber} Has Shipped! 🚚

Hi ${user.name},

Your order is on its way!${order.trackingCode ? `\n\nTracking Code: ${order.trackingCode}` : ''}

Order #: ${order.orderNumber}
Status: Shipped

Items:
${(order.items || []).map((i) => `- ${i.name} x${i.quantity}`).join('\n')}

Track your order: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders

© ${year()} Stay. All rights reserved.
  `.trim();

  return sendEmail({
    to: user.email ?? '',
    subject: `🚚 Your order #${order.orderNumber} is on its way!`,
    html,
    text,
  });
};

// ─── Order Cancelled ──────────────────────────────────────────────────────────

/**
 * Send a dedicated "order cancelled" email with optional reason and refund info
 */
export const sendOrderCancelled = async (order: OrderLike, user: UserLike, reason?: string) => {
  const html = baseHtml(
    `Order #${order.orderNumber} Cancelled`,
    `Your order #${order.orderNumber} has been cancelled. We're sorry to see this happen.`,
    `<!--HEADER_CONTENT-->
      <div style="width:64px;height:64px;background:rgba(255,255,255,0.20);border-radius:50%;margin:0 auto 16px;text-align:center;line-height:64px;font-size:32px;">❌</div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">Order Cancelled</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);">We're sorry your order didn't work out.</p>
    <!--/HEADER_CONTENT-->
    <!--BODY-->
      <p style="margin:0 0 20px;font-size:15px;color:#334155;">Hi <strong style="color:#0f172a;">${user.name}</strong>,</p>
      <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;">
        We're confirming that your order <strong style="color:#0f172a;">#${order.orderNumber}</strong> has been cancelled.
        ${reason ? `The reason provided was: <em>"${reason}"</em>.` : ''}
      </p>

      <!-- Cancelled order card -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
             style="background:#fff5f5;border:1px solid #fecaca;border-radius:14px;overflow:hidden;margin-bottom:28px;">
        <tr>
          <td style="padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td width="50%" style="padding:6px 0;vertical-align:top;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Order Number</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#0ea5e9;">#${order.orderNumber}</p>
                </td>
                <td width="50%" style="padding:6px 0;vertical-align:top;text-align:right;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Status</p>
                  <p style="margin:0;">${statusBadge('CANCELLED')}</p>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:12px 0 0;">
                  <div style="border-top:1px solid #fecaca;"></div>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:12px 0 0;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Order Date</p>
                  <p style="margin:0;font-size:13px;color:#475569;">${fmtDate(order.createdAt)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Cancelled items -->
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Cancelled Items</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
        ${itemRows(order.items)}
      </table>

      <!-- Refund note -->
      <div style="background:#f0f9ff;border-left:4px solid #0ea5e9;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:28px;">
        <p style="margin:0;font-size:13px;color:#0369a1;line-height:1.6;">
          💳 <strong>Refund info:</strong> If you paid online, your refund will be processed within 5–7 business days to your original payment method. For COD orders, no charge was made.
        </p>
      </div>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
        <tr>
          <td align="center">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/products"
               style="display:inline-block;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:100px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(14,165,233,0.35);">
              Continue Shopping &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;line-height:1.6;">
        Have questions about this cancellation? Contact our <strong>support team</strong> — we're happy to help.
      </p>
    <!--/BODY-->`,
  );

  const text = `
Order #${order.orderNumber} Cancelled

Hi ${user.name},

Your order #${order.orderNumber} has been cancelled.${reason ? `\nReason: ${reason}` : ''}

Order Date: ${fmtDate(order.createdAt)}

Items:
${(order.items || []).map((i) => `- ${i.name} x${i.quantity}: ${fmt(Number(i.price) * (i.quantity ?? 0))}`).join('\n')}

Total: ${fmt(order.total)}

If you paid online, your refund will be processed within 5–7 business days.

Continue shopping: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/products

© ${year()} Stay. All rights reserved.
  `.trim();

  return sendEmail({
    to: user.email ?? '',
    subject: `❌ Order #${order.orderNumber} has been cancelled`,
    html,
    text,
  });
};

// ─── Payment Receipt ──────────────────────────────────────────────────────────

/**
 * Send payment receipt / invoice email after successful payment
 */
export const sendPaymentReceipt = async (order: OrderLike, transactionId?: string) => {
  const user = order.user ?? {
    name: order.shippingAddress?.name || 'Customer',
    email: order.email,
  };

  const paymentMethodLabel: Record<string, string> = {
    COD:         '💵 Cash on Delivery',
    VNPAY:       '🏦 VNPay',
    MOMO:        '💜 MoMo',
    ZALOPAY:     '🔵 ZaloPay',
    BANK:        '🏦 Bank Transfer',
    CREDIT_CARD: '💳 Credit Card',
  };
  const pmLabel =
    paymentMethodLabel[order.paymentMethod?.toUpperCase() ?? ''] ??
    order.paymentMethod ??
    'Online';

  const html = baseHtml(
    `Payment Receipt — #${order.orderNumber}`,
    `Payment confirmed for order #${order.orderNumber}. Here is your receipt.`,
    `<!--HEADER_CONTENT-->
      <div style="width:64px;height:64px;background:rgba(255,255,255,0.25);border-radius:50%;margin:0 auto 16px;text-align:center;line-height:64px;font-size:32px;">🧾</div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;">Payment Receipt</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);">Your payment was received successfully</p>
    <!--/HEADER_CONTENT-->
    <!--BODY-->
      <p style="margin:0 0 20px;font-size:15px;color:#334155;">Hi <strong style="color:#0f172a;">${user.name}</strong>,</p>
      <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;">
        We've received your payment. This email serves as your official receipt for the order below.
      </p>

      <!-- Order meta -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
             style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;margin-bottom:24px;">
        <tr>
          <td style="padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td width="50%" style="padding:6px 0;vertical-align:top;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Order Number</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#0ea5e9;">#${order.orderNumber}</p>
                </td>
                <td width="50%" style="padding:6px 0;vertical-align:top;text-align:right;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Payment</p>
                  <p style="margin:0;">${statusBadge('PAID')}</p>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:12px 0;">
                  <div style="border-top:1px solid #e2e8f0;"></div>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding:0 0 6px;vertical-align:top;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Order Date</p>
                  <p style="margin:0;font-size:13px;color:#475569;">${fmtDate(order.createdAt)}</p>
                </td>
                <td width="50%" style="padding:0 0 6px;vertical-align:top;text-align:right;">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Payment Method</p>
                  <p style="margin:0;font-size:13px;color:#475569;">${pmLabel}</p>
                </td>
              </tr>
              ${transactionId ? `
              <tr>
                <td colspan="2" style="padding:12px 0 0;">
                  <div style="border-top:1px solid #e2e8f0;padding-top:12px;">
                    <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Transaction ID</p>
                    <p style="margin:0;font-size:13px;color:#475569;font-family:'Courier New',monospace;">${transactionId}</p>
                  </div>
                </td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>

      <!-- Items -->
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Order Items</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
        ${itemRows(order.items)}
      </table>

      <!-- Price summary -->
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:14px;padding:20px 24px;margin-bottom:28px;">
        ${priceSummary(order)}
      </div>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
        <tr>
          <td align="center">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders"
               style="display:inline-block;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:100px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(14,165,233,0.35);">
              View Order &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;line-height:1.6;">
        Need a VAT invoice or have questions? Contact our <strong>support team</strong>.
      </p>
    <!--/BODY-->`,
  );

  const text = `
Payment Receipt — #${order.orderNumber}

Hi ${user.name},

Your payment has been confirmed.

Order #: ${order.orderNumber}
Date: ${fmtDate(order.createdAt)}
Payment Method: ${pmLabel}
${transactionId ? `Transaction ID: ${transactionId}\n` : ''}
Items:
${(order.items || []).map((i) => `- ${i.name} x${i.quantity}: ${fmt(Number(i.price) * (i.quantity ?? 0))}`).join('\n')}

Subtotal: ${fmt(order.subtotal)}
${(order.shippingFee ?? 0) > 0 ? `Shipping: ${fmt(order.shippingFee)}\n` : ''}${Number(order.discount ?? 0) > 0 ? `Discount: -${fmt(order.discount)}\n` : ''}Total: ${fmt(order.total)}

© ${year()} Stay. All rights reserved.
  `.trim();

  const recipient = (user as { email?: string }).email ?? '';
  return sendEmail({
    to: recipient,
    subject: `🧾 Payment Receipt — #${order.orderNumber}`,
    html,
    text,
  });
};
