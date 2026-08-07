import { Injectable, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Pool } from 'pg';
import Redis from 'ioredis';
import * as CryptoJS from 'crypto-js';
import { randomUUID } from 'crypto';

export enum PaymentStatus {
  CREATED = 'PENDING', // Mapped to PENDING in DB
  PENDING = 'PENDING',
  PAID = 'SUCCEEDED', // Must match DB check constraint chk_payment_status
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

@Injectable()
export class PaymentService {
  private dbPool: Pool;
  private redis: Redis;
  private clickSecretKey: string;
  private paymeSecretKey: string;

  constructor() {
    if (!process.env.DATABASE_URL) throw new Error('FATAL: DATABASE_URL is missing from .env');
    this.dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    this.clickSecretKey = process.env.CLICK_SECRET_KEY as string;
    this.paymeSecretKey = process.env.PAYME_SECRET_KEY as string;

    if (!this.clickSecretKey || !this.paymeSecretKey) {
      throw new Error('FATAL: Payment gateway secret keys are not configured in environment variables.');
    }
  }

  // ============================================================================
  // Click Signature Validation
  // ============================================================================
  verifyClickSignature(
    clickTransId: number,
    serviceId: number,
    merchantTransId: string,
    amount: number,
    action: number,
    error: number,
    signTime: string,
    receivedSign: string
  ): boolean {
    const rawString = `${clickTransId}${serviceId}${merchantTransId}${amount}${action}${error}${signTime}${this.clickSecretKey}`;
    const calculatedSign = CryptoJS.MD5(rawString).toString();
    return calculatedSign === receivedSign;
  }

  // ============================================================================
  // Payme Authorization Header Validation
  // ============================================================================
  verifyPaymeAuth(authHeader: string): boolean {
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return false;
    }
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    
    // Payme sends "Paycom" as username and merchant secret key as password
    return username === 'Paycom' && password === this.paymeSecretKey;
  }

  // ============================================================================
  // Log Checkout Attempt (CREATED/PENDING)
  // ============================================================================
  async logCheckoutAttempt(bookingId: string, gateway: string, amount: number) {
    const client = await this.dbPool.connect();
    try {
      const paymentId = randomUUID();
      await client.query(
        `INSERT INTO payments (id, booking_id, amount, payment_gateway, gateway_transaction_id, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [paymentId, bookingId, amount, gateway, 'PENDING_CHECKOUT', PaymentStatus.PENDING]
      );
      await client.query(
        `INSERT INTO audit_logs (id, entity_type, entity_id, action, changed_by, metadata)
         VALUES ($1, 'PAYMENT', $2, 'CHECKOUT_INITIATED', 'SYSTEM', $3)`,
         [randomUUID(), paymentId, JSON.stringify({ amount, gateway })]
      );
    } catch (err) {
      console.warn(`[WARN] Failed to log checkout attempt: ${err.message}`);
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // Mark Payment as Failed
  // ============================================================================
  async markPaymentAsFailed(bookingId: string, gateway: string, transactionId: string, errorReason: string) {
    const client = await this.dbPool.connect();
    try {
      const paymentId = randomUUID();
      await client.query(
        `INSERT INTO payments (id, booking_id, amount, payment_gateway, gateway_transaction_id, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [paymentId, bookingId, 0, gateway, transactionId, PaymentStatus.FAILED]
      );
      await client.query(
        `INSERT INTO audit_logs (id, entity_type, entity_id, action, changed_by, metadata)
         VALUES ($1, 'PAYMENT', $2, 'FAILED_TRANSACTION', 'SYSTEM', $3)`,
         [randomUUID(), paymentId, JSON.stringify({ reason: errorReason, gateway, transactionId })]
      );
    } catch (err) {
      console.warn(`[WARN] Failed to mark payment as failed: ${err.message}`);
    } finally {
      client.release();
    }
  }



  // ============================================================================
  // Settle Digital Payment (Ledger split payouts)
  // ============================================================================
  async settleDigitalPayment(bookingId: string, gateway: string, transactionId: string, amountPaid: number) {
    const client = await this.dbPool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch Booking and verify status
      const bookingRes = await client.query(
        'SELECT id, scheduled_start, barber_id, current_status FROM bookings WHERE id = $1 FOR UPDATE',
        [bookingId]
      );
      if (bookingRes.rows.length === 0) {
        throw new BadRequestException('Booking target not found');
      }
      const booking = bookingRes.rows[0];

      // Double-payment and Idempotency protection
      const existingPayment = await client.query(
        'SELECT id, status FROM payments WHERE (booking_id = $1 AND status = $2) OR (payment_gateway = $3 AND gateway_transaction_id = $4 AND status = $2)',
        [bookingId, PaymentStatus.PAID, gateway, transactionId]
      );
      
      if (existingPayment.rows.length > 0) {
        console.log(`[PAYMENT] Booking ${bookingId} already paid. Ignoring duplicate webhook.`);
        await client.query('ROLLBACK');
        return { success: true, booking_id: bookingId, status: 'ALREADY_PAID' }; // Returning success avoids gateway retries
      }

      // 2. Settle payment record
      const paymentId = randomUUID();
      await client.query(
        `INSERT INTO payments (id, booking_id, amount, payment_gateway, gateway_transaction_id, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [paymentId, bookingId, amountPaid, gateway, transactionId, PaymentStatus.PAID]
      );

      // 3. Update booking status
      await client.query(
        "UPDATE bookings SET is_paid = true, current_status = 'CONFIRMED' WHERE id = $1",
        [bookingId]
      );

      // 4. Retrieve barber rank to calculate commission rate splits
      const barberId = booking.barber_id;
      const rankRes = await client.query(
        'SELECT rank_grade FROM barber_rankings WHERE barber_id = $1', [barberId]
      );
      const rank = rankRes.rows.length > 0 ? rankRes.rows[0].rank_grade : 'C';
      
      const commissionRate = rank === 'S' ? 0.05 : rank === 'A' ? 0.07 : 0.10;
      const commissionAmount = amountPaid * commissionRate;
      const netBarberPayout = amountPaid - commissionAmount;

      // 5. Insert double-entry ledger transactions
      // Debit commission fee to platform
      await client.query(
        `INSERT INTO transactions (payment_id, sender_user_id, receiver_user_id, amount, type)
         VALUES ($1, $2, NULL, $3, 'COMMISSION_DEBIT')`,
         [paymentId, barberId, commissionAmount]
      );
      // Credit payout balance to barber
      await client.query(
        `INSERT INTO transactions (payment_id, sender_user_id, receiver_user_id, amount, type)
         VALUES ($1, NULL, $2, $3, 'BARBER_PAYOUT')`,
         [paymentId, barberId, netBarberPayout]
      );

      // Audit Trail Logging
      await client.query(
        `INSERT INTO audit_logs (id, entity_type, entity_id, action, changed_by, metadata)
         VALUES ($1, 'PAYMENT', $2, 'SETTLEMENT', 'SYSTEM', $3)`,
         [randomUUID(), paymentId, JSON.stringify({ amount: amountPaid, gateway, transactionId })]
      );

      await client.query('COMMIT');
      
      // Post-commit trigger to evaluate barber's active commission balance states
      await this.evaluateBarberDebtLock(barberId);

      return { success: true, booking_id: bookingId, status: 'CONFIRMED' };

    } catch (err) {
      await client.query('ROLLBACK');
      throw new InternalServerErrorException(err.message || 'Payment settlement failed.');
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // Dynamic Rank-Based Commission Debt Lockout Engine
  // ============================================================================
  async evaluateBarberDebtLock(barberId: string): Promise<void> {
    const client = await this.dbPool.connect();
    try {
      await client.query('BEGIN');

      // A. Calculate cumulative commission debt (CASH commission charges minus digital payout mitigations)
      const balanceQuery = `
        SELECT COALESCE(SUM(
          CASE 
            WHEN type = 'COMMISSION_DEBIT' THEN amount
            WHEN type = 'BARBER_PAYOUT' THEN -amount
            ELSE 0.00
          END
        ), 0.00) AS net_commission_debt
        FROM transactions
        WHERE sender_user_id = $1 OR receiver_user_id = $1;
      `;
      const balanceRes = await client.query(balanceQuery, [barberId]);
      const netDebt = parseFloat(balanceRes.rows[0].net_commission_debt);

      // B. Fetch barber's rank
      const rankRes = await client.query(
        'SELECT rank_grade FROM barber_rankings WHERE barber_id = $1', [barberId]
      );
      const rank = rankRes.rows.length > 0 ? rankRes.rows[0].rank_grade : 'C';

      // C. Define dynamic rank-based debt thresholds (in UZS)
      const rankThresholds: Record<string, number> = {
        'S': 1000000.00,
        'A': 800000.00,
        'B': 600000.00,
        'C': 400000.00,
        'D': 300000.00,
        'E': 200000.00,
        'F': 150000.00,
      };

      const threshold = rankThresholds[rank] || 400000.00;

      // D. Check condition and execute locking
      if (netDebt > threshold) {
        // LOCK: set is_available = FALSE
        await client.query(
          'UPDATE barber_profiles SET is_available = FALSE WHERE user_id = $1',
          [barberId]
        );
        console.log(`[LOCKOUT] Barber ${barberId} calendar LOCKED. Net Debt: ${netDebt} UZS (Threshold: ${threshold} UZS)`);
      } else {
        // UNLOCK: set is_available = TRUE
        await client.query(
          'UPDATE barber_profiles SET is_available = TRUE WHERE user_id = $1',
          [barberId]
        );
        console.log(`[ACTIVE] Barber ${barberId} calendar ACTIVE. Net Debt: ${netDebt} UZS (Threshold: ${threshold} UZS)`);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`Error during evaluateBarberDebtLock: ${err.message}`);
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // Get Ledger (Barber Financial Overview)
  // ============================================================================
  async getLedger(barberId: string) {
    const client = await this.dbPool.connect();
    try {
      // Wallet Balance (Digital Payments sent to this barber - minus any refunds/payouts)
      const walletRes = await client.query(
        `SELECT COALESCE(SUM(amount), 0) as balance 
         FROM transactions 
         WHERE receiver_user_id = $1 AND type = 'USER_PAYMENT'`,
        [barberId]
      );
      
      const payoutRes = await client.query(
        `SELECT COALESCE(SUM(amount), 0) as paid 
         FROM transactions 
         WHERE sender_user_id = $1 AND type = 'BARBER_PAYOUT'`,
        [barberId]
      );
      
      const digitalWallet = parseFloat(walletRes.rows[0].balance) - parseFloat(payoutRes.rows[0].paid);

      // Cash Wallet (Cash bookings that are paid)
      const cashRes = await client.query(
        `SELECT COALESCE(SUM(price), 0) as cash 
         FROM bookings 
         WHERE barber_id = $1 AND payment_method = 'CASH' AND is_paid = true`,
        [barberId]
      );
      const cashWallet = parseFloat(cashRes.rows[0].cash);

      // Commission Debt (Cash bookings 10% cut)
      const debtRes = await client.query(
        `SELECT COALESCE(SUM(amount), 0) as debt 
         FROM transactions 
         WHERE sender_user_id = $1 AND type = 'COMMISSION_DEBIT'`,
        [barberId]
      );
      
      const paidDebtRes = await client.query(
        `SELECT COALESCE(SUM(amount), 0) as paid 
         FROM transactions 
         WHERE receiver_user_id = $1 AND type = 'COMMISSION_CREDIT'`,
        [barberId]
      );
      
      const commissionDebt = parseFloat(debtRes.rows[0].debt) - parseFloat(paidDebtRes.rows[0].paid);

      // Recent Transactions
      const txRes = await client.query(
        `SELECT id, type, amount, created_at,
         CASE 
            WHEN type = 'COMMISSION_DEBIT' THEN 'Komissiya yig''imi'
            WHEN type = 'COMMISSION_CREDIT' THEN 'Komissiya qarzi to''lovi'
            WHEN type = 'BARBER_PAYOUT' THEN 'Mablag'' yechib olindi'
            WHEN type = 'USER_PAYMENT' THEN 'Onlayn to''lov qabul qilindi'
            ELSE type 
         END as description
         FROM transactions
         WHERE sender_user_id = $1 OR receiver_user_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [barberId]
      );

      const transactions = txRes.rows.map(row => ({
        id: row.id,
        type: row.type,
        amount: parseFloat(row.amount),
        description: row.description,
        date: new Date(row.created_at).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      }));

      return {
        digitalWallet,
        cashWallet,
        commissionDebt,
        transactions
      };
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // Refund Flow (Cancel Transaction)
  // ============================================================================
  async processRefund(bookingId: string) {
    const client = await this.dbPool.connect();
    try {
      await client.query('BEGIN');
      
      const bookingRes = await client.query('SELECT current_status, barber_id FROM bookings WHERE id = $1 FOR UPDATE', [bookingId]);
      if (bookingRes.rows.length === 0) throw new BadRequestException('Booking not found');
      
      const paymentRes = await client.query('SELECT id, amount FROM payments WHERE booking_id = $1 AND status = $2', [bookingId, PaymentStatus.PAID]);
      if (paymentRes.rows.length === 0) return { success: true, message: 'Already refunded or not paid' };

      const paymentId = paymentRes.rows[0].id;

      // Mark payment as REFUNDED
      await client.query("UPDATE payments SET status = $1 WHERE id = $2", [PaymentStatus.REFUNDED, paymentId]);

      // Reverse transactions (Credit platform, Debit Barber)
      await client.query(
        `INSERT INTO transactions (payment_id, sender_user_id, receiver_user_id, amount, type)
         SELECT payment_id, NULL, sender_user_id, amount, 'COMMISSION_REFUND'
         FROM transactions WHERE payment_id = $1 AND type = 'COMMISSION_DEBIT'`,
         [paymentId]
      );
      await client.query(
        `INSERT INTO transactions (payment_id, sender_user_id, receiver_user_id, amount, type)
         SELECT payment_id, receiver_user_id, NULL, amount, 'BARBER_PAYOUT_REFUND'
         FROM transactions WHERE payment_id = $1 AND type = 'BARBER_PAYOUT'`,
         [paymentId]
      );

      // Cancel Booking
      await client.query("UPDATE bookings SET is_paid = false, current_status = 'CANCELLED' WHERE id = $1", [bookingId]);

      // Audit Trail Logging
      await client.query(
        `INSERT INTO audit_logs (id, entity_type, entity_id, action, changed_by, metadata)
         VALUES ($1, 'PAYMENT', $2, 'REFUND', 'SYSTEM', $3)`,
         [randomUUID(), paymentId, JSON.stringify({ booking_id: bookingId, amount: paymentRes.rows[0].amount })]
      );

      await client.query('COMMIT');
      
      await this.evaluateBarberDebtLock(bookingRes.rows[0].barber_id);
      console.log(`[REFUND] Processed refund for booking ${bookingId}`);
      return { success: true, refunded: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw new InternalServerErrorException(err.message || 'Refund processing failed');
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // Failed Payment Recovery (Cron Job)
  // ============================================================================
  @Cron('*/5 * * * *')
  async recoverFailedPayments() {
    console.log('[CRON] Running recoverFailedPayments job...');
    const client = await this.dbPool.connect();
    try {
      await client.query('BEGIN');
      
      // Find bookings created > 15 mins ago that are PENDING and not paid
      const query = `
        SELECT id FROM bookings 
        WHERE current_status = 'PENDING' 
        AND is_paid = false 
        AND created_at < NOW() - INTERVAL '15 minutes'
        FOR UPDATE SKIP LOCKED;
      `;
      const res = await client.query(query);

      for (const row of res.rows) {
        await client.query("UPDATE bookings SET current_status = 'CANCELLED' WHERE id = $1", [row.id]);
        console.log(`[RECOVERY] Cancelled unpaid booking ${row.id} to release time slot.`);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[CRON ERROR] recoverFailedPayments failed: ${err.message}`);
    } finally {
      client.release();
    }
  }
}
