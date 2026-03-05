import { sendEmail } from '../config/email.js';
import { log } from '../utils/logger.js';

/**
 * Email templates and service functions
 */

/**
 * Send order confirmation email
 */
export const sendOrderConfirmation = async (order, user) => {
  const orderItems = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.name} x ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${(Number(item.price) * item.quantity).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .order-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; }
        .total { font-size: 18px; font-weight: bold; text-align: right; padding-top: 10px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmation</h1>
        </div>
        <div class="content">
          <p>Hello ${user.name},</p>
          <p>Thank you for your order! We've received your order and will process it shortly.</p>
          
          <div class="order-details">
            <h2>Order Details</h2>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            
            <h3>Items:</h3>
            <table>
              ${orderItems}
            </table>
            <div class="total">
              <p>Subtotal: $${Number(order.subtotal).toFixed(2)}</p>
              ${order.shippingFee > 0 ? `<p>Shipping: $${Number(order.shippingFee).toFixed(2)}</p>` : ''}
              ${order.discount > 0 ? `<p>Discount: -$${Number(order.discount).toFixed(2)}</p>` : ''}
              <p>Total: $${Number(order.total).toFixed(2)}</p>
            </div>
          </div>
          
          <p>We'll send you another email when your order ships.</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Stay. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Order Confirmation

Hello ${user.name},

Thank you for your order! We've received your order and will process it shortly.

Order Number: ${order.orderNumber}
Order Date: ${new Date(order.createdAt).toLocaleDateString()}
Status: ${order.status}

Items:
${order.items.map((item) => `- ${item.name} x ${item.quantity}: $${(Number(item.price) * item.quantity).toFixed(2)}`).join('\n')}

Subtotal: $${Number(order.subtotal).toFixed(2)}
${order.shippingFee > 0 ? `Shipping: $${Number(order.shippingFee).toFixed(2)}\n` : ''}
${order.discount > 0 ? `Discount: -$${Number(order.discount).toFixed(2)}\n` : ''}
Total: $${Number(order.total).toFixed(2)}

We'll send you another email when your order ships.
If you have any questions, please contact our support team.

© ${new Date().getFullYear()} Stay. All rights reserved.
  `;

  return sendEmail({
    to: user.email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html,
    text,
  });
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .warning { color: #f44336; font-size: 14px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello ${user.name},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          <p class="warning">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Stay. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Password Reset Request

Hello ${user.name},

We received a request to reset your password. Click the link below to reset it:

${resetUrl}

This link will expire in 1 hour. If you didn't request this, please ignore this email.

© ${new Date().getFullYear()} Stay. All rights reserved.
  `;

  return sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html,
    text,
  });
};

/**
 * Send order status update email
 */
export const sendOrderStatusUpdate = async (order, user, oldStatus, newStatus) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .status { font-size: 24px; font-weight: bold; color: #4CAF50; text-align: center; padding: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Status Update</h1>
        </div>
        <div class="content">
          <p>Hello ${user.name},</p>
          <p>Your order status has been updated:</p>
          <div class="status">${newStatus}</div>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          ${order.trackingCode ? `<p><strong>Tracking Code:</strong> ${order.trackingCode}</p>` : ''}
          <p>You can check your order status anytime in your account.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Stay. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `Order ${order.orderNumber} - Status Updated to ${newStatus}`,
    html,
    text: `Your order ${order.orderNumber} status has been updated to ${newStatus}.`,
  });
};

/**
 * Send payment receipt / invoice email after successful payment
 */
export const sendPaymentReceipt = async (order, transactionId?: string) => {
  // Prefer linked user info; fall back to order email if needed
  const user = order.user || {
    name: order.shippingAddress?.name || 'Customer',
    email: order.email,
  };

  const orderItems = (order.items || [])
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.name} x ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${(Number(item.price) * item.quantity).toFixed(2)}
      </td>
    </tr>
  `,
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .order-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; }
        .total { font-size: 18px; font-weight: bold; text-align: right; padding-top: 10px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Receipt</h1>
        </div>
        <div class="content">
          <p>Hello ${user.name},</p>
          <p>We have received your payment for the order below. This email is your invoice/receipt.</p>
          
          <div class="order-details">
            <h2>Order Details</h2>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Payment Status:</strong> ${order.paymentStatus || 'PAID'}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod || 'Online'}</p>
            ${transactionId ? `<p><strong>Transaction ID:</strong> ${transactionId}</p>` : ''}
            
            <h3>Items:</h3>
            <table>
              ${orderItems}
            </table>
            <div class="total">
              <p>Subtotal: $${Number(order.subtotal).toFixed(2)}</p>
              ${order.shippingFee > 0 ? `<p>Shipping: $${Number(order.shippingFee).toFixed(2)}</p>` : ''}
              ${order.discount > 0 ? `<p>Discount: -$${Number(order.discount).toFixed(2)}</p>` : ''}
              <p>Total: $${Number(order.total).toFixed(2)}</p>
            </div>
          </div>
          
          <p>You can view this order anytime in your account.</p>
          <p>If you need a VAT invoice or have any questions, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Stay. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Payment Receipt

Hello ${user.name},

We have received your payment for your order.

Order Number: ${order.orderNumber}
Order Date: ${new Date(order.createdAt).toLocaleDateString()}
Payment Status: ${order.paymentStatus || 'PAID'}
Payment Method: ${order.paymentMethod || 'Online'}
${transactionId ? `Transaction ID: ${transactionId}\n` : ''}

Items:
${(order.items || [])
  .map(
    (item) =>
      `- ${item.name} x ${item.quantity}: $${(Number(item.price) * item.quantity).toFixed(2)}`,
  )
  .join('\n')}

Subtotal: $${Number(order.subtotal).toFixed(2)}
${order.shippingFee > 0 ? `Shipping: $${Number(order.shippingFee).toFixed(2)}\n` : ''}
${order.discount > 0 ? `Discount: -$${Number(order.discount).toFixed(2)}\n` : ''}
Total: $${Number(order.total).toFixed(2)}

You can view this order anytime in your account.
If you need a VAT invoice or have any questions, please contact our support team.

© ${new Date().getFullYear()} Stay. All rights reserved.
  `;

  return sendEmail({
    to: user.email,
    subject: `Payment Receipt - ${order.orderNumber}`,
    html,
    text,
  });
};


