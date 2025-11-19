import axios from 'axios';
import { Buffer } from 'buffer';
import { AppDataSource } from '../config/database';
import { MpesaTransaction } from '../entities/MpesaTransaction';
import { Order, OrderStatus } from '../entities/Order';

// Environment Variables
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY!;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE!; 
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL!;
const MPESA_ENV = process.env.MPESA_ENV || 'sandbox';

const BASE_URL = MPESA_ENV === 'production' 
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke';

export class MpesaService {
  private static transactionRepo = AppDataSource.getRepository(MpesaTransaction);
  private static orderRepo = AppDataSource.getRepository(Order);

  private static formatPhoneNumber(phone: string): string {
    let p = phone.replace(/\s/g, '').replace(/\+/g, '');
    if (p.startsWith('07') || p.startsWith('01')) {
      p = '254' + p.substring(1);
    }
    return p;
  }

  private static async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    try {
      const response = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: { Authorization: `Basic ${auth}` }
      });
      return response.data.access_token;
    } catch (error) {
      console.error('Mpesa Auth Error:', error);
      throw new Error('Failed to authenticate with Safaricom');
    }
  }

  static async initiateStkPush(orderId: string, phoneNumber: string, amount: number) {
    const token = await this.getAccessToken();
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: `Masuma Order`,
      TransactionDesc: `Payment for Order ${orderId.slice(0, 5)}`
    };

    try {
      const response = await axios.post(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const order = await this.orderRepo.findOneBy({ id: orderId });
      if (!order) throw new Error('Order not found');

      const tx = this.transactionRepo.create({
        order: order,
        merchantRequestID: response.data.MerchantRequestID,
        checkoutRequestID: response.data.CheckoutRequestID,
        amount: amount,
        phoneNumber: formattedPhone,
        status: 'PENDING'
      });

      await this.transactionRepo.save(tx);
      return response.data;
    } catch (error: any) {
      console.error('STK Push Error:', error.response?.data || error.message);
      throw new Error('Failed to initiate M-Pesa payment');
    }
  }

  static async handleCallback(body: any) {
    const { stkCallback } = body.Body;
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    const transaction = await this.transactionRepo.findOne({
      where: { checkoutRequestID: CheckoutRequestID },
      relations: ['order']
    });

    if (!transaction) {
      console.error(`Transaction not found for CheckoutID: ${CheckoutRequestID}`);
      return;
    }

    if (ResultCode === 0) {
      const items = CallbackMetadata.Item;
      const receiptItem = items.find((i: any) => i.Name === 'MpesaReceiptNumber');
      const receiptNumber = receiptItem?.Value;

      transaction.status = 'COMPLETED';
      transaction.mpesaReceiptNumber = receiptNumber;
      transaction.resultDesc = ResultDesc;
      await this.transactionRepo.save(transaction);

      transaction.order.status = OrderStatus.PAID;
      await this.orderRepo.save(transaction.order);

      console.log(`Payment Verified: ${receiptNumber} for Order ${transaction.order.id}`);
    } else {
      transaction.status = 'FAILED';
      transaction.resultDesc = ResultDesc;
      await this.transactionRepo.save(transaction);
      console.log(`Payment Failed: ${ResultDesc}`);
    }
  }
}
