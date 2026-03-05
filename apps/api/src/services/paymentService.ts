import crypto from 'crypto';
import { config } from '../config/index.js';
import { query, queryOne, insert, execute, beginTransaction, commit, rollback } from '../config/database.js';
import { log } from '../utils/logger.js';
import { userOrderModel } from '../models/client/order.model.js';
import { sendPaymentReceipt } from './emailService.js';

export interface PaymentData {
  orderId: number;
  amount: number;
  orderInfo: string;
  returnUrl?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  message?: string;
}

/**
 * VNPay Payment Service
 */
export class PaymentService {
  /**
   * Create VNPay payment URL
   * @param {PaymentData} data - Payment data including orderId, amount, and orderInfo
   * @param {number} data.orderId - Order ID to create payment for
   * @param {number} data.amount - Payment amount in VND
   * @param {string} data.orderInfo - Order description/information
   * @param {string} [data.returnUrl] - Return URL after payment (optional)
   * @returns {Promise<PaymentResult>} Payment result with payment URL or error message
   */
  static async createVNPayPayment(data: PaymentData): Promise<PaymentResult> {
    try {
      const {
        orderId,
        amount,
        orderInfo,
        returnUrl = config.payment.vnpay.returnUrl,
      } = data;

      const tmnCode = config.payment.vnpay.tmnCode;
      const secretKey = config.payment.vnpay.secretKey;
      const vnpUrl = config.payment.vnpay.url;

      if (!tmnCode || !secretKey) {
        throw new Error('VNPay configuration is missing');
      }

      const vnp_TxnRef = `ORDER${orderId}_${Date.now()}`;
      const vnp_Amount = Math.round(amount * 100); // Convert to cents
      const vnp_Command = 'pay';
      const vnp_CreateDate = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + '00';
      const vnp_CurrCode = 'VND';
      const vnp_IpAddr = '127.0.0.1'; // Should get from request
      const vnp_Locale = 'vn';
      const vnp_OrderInfo = orderInfo;
      const vnp_OrderType = 'other';
      const vnp_ReturnUrl = returnUrl;
      const vnp_TmnCode = tmnCode;
      const vnp_Version = '2.1.0';

      // Create payment record
      const paymentId = await insert(
        `INSERT INTO payments (order_id, amount, payment_method, status, transaction_ref, created_at)
         VALUES (?, ?, 'VNPAY', 'PENDING', ?, NOW())`,
        [orderId, amount, vnp_TxnRef]
      );

      // Build query string
      const vnp_Params: Record<string, string> = {
        vnp_Amount: vnp_Amount.toString(),
        vnp_Command,
        vnp_CreateDate,
        vnp_CurrCode,
        vnp_IpAddr,
        vnp_Locale,
        vnp_OrderInfo,
        vnp_OrderType,
        vnp_ReturnUrl,
        vnp_TmnCode,
        vnp_TxnRef,
        vnp_Version,
      };

      // Sort params and create secure hash
      const sortedParams = Object.keys(vnp_Params)
        .sort()
        .map((key) => `${key}=${vnp_Params[key]}`)
        .join('&');

      const vnp_SecureHash = crypto
        .createHmac('sha512', secretKey)
        .update(sortedParams)
        .digest('hex');

      vnp_Params.vnp_SecureHash = vnp_SecureHash;

      const paymentUrl = `${vnpUrl}?${new URLSearchParams(vnp_Params).toString()}`;

      // Update payment record with transaction ID
      await execute(
        `UPDATE payments SET transaction_id = ? WHERE id = ?`,
        [vnp_TxnRef, paymentId]
      );

      return {
        success: true,
        paymentUrl,
        transactionId: vnp_TxnRef,
      };
    } catch (error) {
      log.error('VNPay payment creation failed', error as Error, { data });
      return {
        success: false,
        message: (error as Error).message,
      };
    }
  }

  /**
   * Verify VNPay payment callback and update payment status
   * @param {Record<string, string>} params - VNPay callback parameters
   * @param {string} params.vnp_SecureHash - Secure hash for verification
   * @param {string} params.vnp_ResponseCode - Payment response code ('00' = success)
   * @param {string} params.vnp_TxnRef - Transaction reference
   * @param {string} params.vnp_Amount - Payment amount in cents
   * @returns {Promise<{success: boolean; orderId?: number; amount?: number; transactionId?: string; message?: string}>} Verification result
   */
  static async verifyVNPayCallback(params: Record<string, string>): Promise<{
    success: boolean;
    orderId?: number;
    amount?: number;
    transactionId?: string;
    message?: string;
  }> {
    try {
      const secretKey = config.payment.vnpay.secretKey;
      const vnp_SecureHash = params.vnp_SecureHash;

      if (!vnp_SecureHash) {
        return { success: false, message: 'Missing secure hash' };
      }

      // Remove secure hash from params for verification
      const { vnp_SecureHash: _, ...paramsToVerify } = params;

      // Sort and create hash
      const sortedParams = Object.keys(paramsToVerify)
        .sort()
        .map((key) => `${key}=${paramsToVerify[key]}`)
        .join('&');

      const computedHash = crypto
        .createHmac('sha512', secretKey)
        .update(sortedParams)
        .digest('hex');

      if (computedHash !== vnp_SecureHash) {
        return { success: false, message: 'Invalid secure hash' };
      }

      const vnp_ResponseCode = params.vnp_ResponseCode;
      const vnp_TxnRef = params.vnp_TxnRef;
      const vnp_Amount = parseFloat(params.vnp_Amount) / 100; // Convert from cents

      // Extract order ID from transaction ref
      const orderIdMatch = vnp_TxnRef.match(/ORDER(\d+)_/);
      if (!orderIdMatch) {
        return { success: false, message: 'Invalid transaction reference' };
      }

      const orderId = parseInt(orderIdMatch[1], 10);

      if (vnp_ResponseCode === '00') {
        // Payment successful
        await this.updatePaymentStatus(orderId, 'PAID', vnp_TxnRef);
        return {
          success: true,
          orderId,
          amount: vnp_Amount,
          transactionId: vnp_TxnRef,
        };
      } else {
        // Payment failed
        await this.updatePaymentStatus(orderId, 'FAILED', vnp_TxnRef);
        return {
          success: false,
          orderId,
          message: `Payment failed: ${vnp_ResponseCode}`,
        };
      }
    } catch (error) {
      log.error('VNPay callback verification failed', error as Error, { params });
      return {
        success: false,
        message: (error as Error).message,
      };
    }
  }

  /**
   * Update payment status and order status in database
   * @param {number} orderId - Order ID to update
   * @param {'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'} status - New payment status
   * @param {string} [transactionId] - Transaction ID (optional)
   * @returns {Promise<void>}
   * @throws {Error} If database update fails
   */
  static async updatePaymentStatus(
    orderId: number,
    status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED',
    transactionId?: string
  ): Promise<void> {
    let previousPaymentStatus: string | null = null;

    const connection = await beginTransaction();
    try {
      // Convert undefined to null for SQL
      const transactionIdValue = transactionId ?? null;
      
      // Read current payment status once to avoid sending duplicate receipts
      const [orderStatusRows] = await connection.execute(
        `SELECT paymentStatus FROM orders WHERE id = ?`,
        [orderId]
      );
      if (Array.isArray(orderStatusRows) && orderStatusRows.length > 0) {
        const row = orderStatusRows[0] as { paymentStatus: string | null };
        previousPaymentStatus = row.paymentStatus;
      }
      
      // Check if payment record exists
      const [existingPayments] = await connection.execute(
        `SELECT id FROM payments WHERE order_id = ?`,
        [orderId]
      );
      
      if (Array.isArray(existingPayments) && existingPayments.length === 0) {
        // Payment record doesn't exist, create it
        // Get order info to create payment
        const [orders] = await connection.execute(
          `SELECT total, paymentMethod FROM orders WHERE id = ?`,
          [orderId]
        );
        
        if (Array.isArray(orders) && orders.length > 0) {
          const order = orders[0] as { total: number; paymentMethod: string };
          // Use 'BANK' as default payment method if not specified
          const paymentMethod = order.paymentMethod || 'BANK';
          await connection.execute(
            `INSERT INTO payments (order_id, amount, payment_method, status, transaction_id, transaction_ref, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [orderId, order.total, paymentMethod, status, transactionIdValue, transactionIdValue]
          );
        } else {
          // If order not found, still create payment with BANK method
          const [orderTotal] = await connection.execute(
            `SELECT total FROM orders WHERE id = ?`,
            [orderId]
          );
          if (Array.isArray(orderTotal) && orderTotal.length > 0) {
            const total = (orderTotal[0] as { total: number }).total;
            await connection.execute(
              `INSERT INTO payments (order_id, amount, payment_method, status, transaction_id, transaction_ref, created_at, updated_at)
               VALUES (?, ?, 'BANK', ?, ?, ?, NOW(), NOW())`,
              [orderId, total, status, transactionIdValue, transactionIdValue]
            );
          }
        }
      } else {
        // Update existing payment record
        await connection.execute(
          `UPDATE payments 
           SET status = ?, transaction_id = COALESCE(?, transaction_id), updated_at = NOW()
           WHERE order_id = ?`,
          [status, transactionIdValue, orderId]
        );
      }

      // Update order payment status
      // Note: Column name is paymentStatus (camelCase) in database
      await connection.execute(
        `UPDATE orders 
         SET paymentStatus = ?, updatedAt = NOW()
         WHERE id = ?`,
        [status, orderId]
      );

      // If paid, update order status to PAID
      if (status === 'PAID') {
        await connection.execute(
          `UPDATE orders 
           SET status = 'PAID', updatedAt = NOW()
           WHERE id = ? AND status = 'PENDING'`,
          [orderId]
        );
      }

      // If refunded, cancel the order when it has not shipped/completed
      if (status === 'REFUNDED') {
        await connection.execute(
          `UPDATE orders
           SET status = 'CANCELLED', updatedAt = NOW()
           WHERE id = ? AND status NOT IN ('SHIPPED', 'COMPLETED')`,
          [orderId]
        );
      }

      await commit(connection);
    } catch (error) {
      await rollback(connection);
      throw error;
    }

    // After transaction commit, send payment receipt email once when status changes to PAID
    if (status === 'PAID' && previousPaymentStatus !== 'PAID') {
      try {
        const order = await userOrderModel.getById(orderId);
        if (order && (order.user?.email || order.email)) {
          await sendPaymentReceipt(order, transactionId);
        }
      } catch (error) {
        log.error('Failed to send payment receipt email', error as Error, {
          orderId,
          status,
        });
      }
    }
  }

  /**
   * Get payment record by order ID
   * @param {number} orderId - Order ID to get payment for
   * @returns {Promise<{id: number; order_id: number; amount: number; payment_method: string; status: string; transaction_id: string | null; transaction_ref: string | null; created_at: Date; updated_at: Date} | null>} Payment record or null if not found
   */
  static async getPaymentByOrderId(orderId: number) {
    return queryOne<{
      id: number;
      order_id: number;
      amount: number;
      payment_method: string;
      status: string;
      transaction_id: string | null;
      transaction_ref: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`,
      [orderId]
    );
  }

  /**
   * Create MoMo payment URL (Mock implementation)
   * In production, integrate with MoMo Payment Gateway API
   */
  static async createMoMoPayment(data: PaymentData): Promise<PaymentResult> {
    try {
      const { orderId, amount } = data;
      const transactionRef = `MOMO${orderId}_${Date.now()}`;

      // Create payment record
      const paymentId = await insert(
        `INSERT INTO payments (order_id, amount, payment_method, status, transaction_ref, created_at)
         VALUES (?, ?, 'MOMO', 'PENDING', ?, NOW())`,
        [orderId, amount, transactionRef]
      );

      // In production, call MoMo API here
      // For now, return a mock payment URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const paymentUrl = `${frontendUrl}/payment/momo?orderId=${orderId}&amount=${amount}&transactionRef=${transactionRef}`;

      await execute(
        `UPDATE payments SET transaction_id = ? WHERE id = ?`,
        [transactionRef, paymentId]
      );

      return {
        success: true,
        paymentUrl,
        transactionId: transactionRef,
      };
    } catch (error) {
      log.error('MoMo payment creation failed', error as Error, { data });
      return {
        success: false,
        message: (error as Error).message,
      };
    }
  }

  /**
   * Create ZaloPay payment URL (Mock implementation)
   * In production, integrate with ZaloPay Payment Gateway API
   */
  static async createZaloPayPayment(data: PaymentData): Promise<PaymentResult> {
    try {
      const { orderId, amount } = data;
      const transactionRef = `ZALOPAY${orderId}_${Date.now()}`;

      // Create payment record
      const paymentId = await insert(
        `INSERT INTO payments (order_id, amount, payment_method, status, transaction_ref, created_at)
         VALUES (?, ?, 'ZALOPAY', 'PENDING', ?, NOW())`,
        [orderId, amount, transactionRef]
      );

      // In production, call ZaloPay API here
      // For now, return a mock payment URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const paymentUrl = `${frontendUrl}/payment/zalopay?orderId=${orderId}&amount=${amount}&transactionRef=${transactionRef}`;

      await execute(
        `UPDATE payments SET transaction_id = ? WHERE id = ?`,
        [transactionRef, paymentId]
      );

      return {
        success: true,
        paymentUrl,
        transactionId: transactionRef,
      };
    } catch (error) {
      log.error('ZaloPay payment creation failed', error as Error, { data });
      return {
        success: false,
        message: (error as Error).message,
      };
    }
  }

  /**
   * Create Bank Transfer payment (Mock implementation)
   * In production, generate bank transfer instructions
   */
  static async createBankTransferPayment(data: PaymentData): Promise<PaymentResult> {
    try {
      const { orderId, amount } = data;
      const transactionRef = `BANK${orderId}_${Date.now()}`;

      // Create payment record
      const paymentId = await insert(
        `INSERT INTO payments (order_id, amount, payment_method, status, transaction_ref, created_at)
         VALUES (?, ?, 'BANK', 'PENDING', ?, NOW())`,
        [orderId, amount, transactionRef]
      );

      // In production, generate bank account details and instructions
      // For now, return payment URL to bank transfer page
      await execute(
        `UPDATE payments SET transaction_id = ? WHERE id = ?`,
        [transactionRef, paymentId]
      );

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const paymentUrl = `${frontendUrl}/payment/bank?orderId=${orderId}&amount=${amount}&transactionRef=${transactionRef}`;

      return {
        success: true,
        paymentUrl,
        transactionId: transactionRef,
        message: 'Please transfer to our bank account. Details will be sent via email.',
      };
    } catch (error) {
      log.error('Bank transfer payment creation failed', error as Error, { data });
      return {
        success: false,
        message: (error as Error).message,
      };
    }
  }
}

