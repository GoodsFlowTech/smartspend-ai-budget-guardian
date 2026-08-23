import Razorpay from 'razorpay';
import crypto from 'crypto';

export interface CreateOrderParams {
  amount: number; // in INR (Rupees)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  entity: string;
  amount: number | string; // in paise
  amount_paid: number | string;
  amount_due: number | string;
  currency: string;
  receipt?: string;
  status: string;
  attempts: number;
  notes?: Record<string, any>;
  created_at: number;
  keyId?: string;
}

export class RazorpayService {
  private static client: Razorpay | null = null;

  public static isConfigured(): boolean {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    return !!(keyId && keySecret && keyId.trim() !== '' && keySecret.trim() !== '' && keyId !== 'YOUR_RAZORPAY_KEY_ID');
  }

  private static getClient(): Razorpay {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId === 'YOUR_RAZORPAY_KEY_ID' || keySecret === 'YOUR_RAZORPAY_KEY_SECRET') {
      throw new Error(
        'Razorpay credentials missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file with test-mode API keys from https://dashboard.razorpay.com'
      );
    }

    if (!this.client) {
      this.client = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }

    return this.client;
  }

  /**
   * Creates a real test-mode order using Razorpay REST API
   */
  public static async createOrder(params: CreateOrderParams): Promise<RazorpayOrderResult> {
    const client = this.getClient();
    const amountInPaise = Math.round(params.amount * 100);

    if (amountInPaise <= 0) {
      throw new Error('Transaction amount must be greater than 0');
    }

    const orderOptions = {
      amount: amountInPaise,
      currency: params.currency || 'INR',
      receipt: params.receipt || `rcpt_${Date.now().toString().slice(-8)}`,
      notes: params.notes || {},
    };

    const order = await client.orders.create(orderOptions);
    return {
      ...order,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  }

  /**
   * Cryptographically verifies payment signature using HMAC-SHA256
   */
  public static verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new Error('RAZORPAY_KEY_SECRET is not configured for signature verification');
    }

    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  }

  /**
   * Cryptographically verifies Razorpay webhook signature
   */
  public static verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  }
}
