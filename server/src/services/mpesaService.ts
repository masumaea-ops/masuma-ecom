
import axios from 'axios';
import { Buffer } from 'buffer';
import { AppDataSource } from '../config/database';
import { MpesaTransaction } from '../entities/MpesaTransaction';
import { Order, OrderStatus } from '../entities/Order';
import { SystemSetting } from '../entities/SystemSetting';
import { CacheService } from '../lib/cache';
import { logger } from '../utils/logger';
import { SaleService } from './saleService';

export class MpesaService {
  private static transactionRepo = AppDataSource.getRepository(MpesaTransaction);
  private static orderRepo = AppDataSource.getRepository(Order);
  private static settingsRepo = AppDataSource.getRepository(SystemSetting);

  private static async getSetting(key: string, envKey?: string): Promise<string> {
    const setting = await this.settingsRepo.findOneBy({ key });
    if (setting && setting.value) return setting.value;
    return (envKey && process.env[envKey]) ? process.env[envKey]! : '';
  }

  private static formatPhoneNumber(phone: string): string {
    let p = phone.replace(/\D/g, ''); // Remove non-digits
    if (p.startsWith('07') || p.startsWith('01')) {
      p = '254' + p.substring(1);
    } else if (p.startsWith('7') || p.startsWith('1')) {
        p = '254' + p;
    }
    return p;
  }

  // PII Masking for Logs
  private static maskPhone(phone: string): string {
      if (phone.length < 6) return '***';
      return phone.substring(0, 5) + '******' + phone.substring(phone.length - 2);
  }

  private static async getAccessToken(): Promise<string> {
    // Cache token for 55 minutes to avoid hitting rate limits
    return CacheService.getOrSet('mpesa_access_token', async () => {
        const consumerKey = await this.getSetting('MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_KEY');
        const consumerSecret = await this.getSetting('MPESA_CONSUMER_SECRET', 'MPESA_CONSUMER_SECRET');
        const env = process.env.MPESA_ENV || 'sandbox';
        const baseUrl = env === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

        if (!consumerKey || !consumerSecret) {
            throw new Error('M-Pesa credentials not configured');
        }

        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
        try {
            const response = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
                headers: { Authorization: `Basic ${auth}` },
                timeout: 10000 // 10s timeout
            });
            logger.info('Refreshed M-Pesa Access Token');
            return response.data.access_token;
        } catch (error: any) {
            logger.error('M-Pesa Auth Error:', error.response?.data || error.message);
            throw new Error('Failed to authenticate with Safaricom');
        }
    }, 3300); 
  }

  static async initiateStkPush(orderId: string, phoneNumber: string, amount: number) {
    try {
        const token = await this.getAccessToken();
        const formattedPhone = this.formatPhoneNumber(phoneNumber);
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        
        const shortcode = await this.getSetting('MPESA_SHORTCODE', 'MPESA_SHORTCODE');
        const passkey = await this.getSetting('MPESA_PASSKEY', 'MPESA_PASSKEY');
        const callbackUrl = await this.getSetting('MPESA_CALLBACK_URL', 'MPESA_CALLBACK_URL');
        
        // Support Till Numbers (Buy Goods) vs Paybills
        // If MPESA_STORE_NUMBER is configured, use it for PartyB (Buy Goods), otherwise use shortcode (Paybill)
        const txType = await this.getSetting('MPESA_TRANSACTION_TYPE') || 'CustomerPayBillOnline'; 
        const storeNumber = await this.getSetting('MPESA_STORE_NUMBER');
        const partyB = storeNumber || shortcode;
        
        const env = process.env.MPESA_ENV || 'sandbox';
        const baseUrl = env === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

        if (!shortcode || !passkey || !callbackUrl) {
            throw new Error('Missing M-Pesa Shortcode, Passkey, or Callback URL');
        }

        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

        const payload = {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: txType, 
            Amount: Math.ceil(amount),
            PartyA: formattedPhone,
            PartyB: partyB,
            PhoneNumber: formattedPhone,
            CallBackURL: callbackUrl,
            AccountReference: `ORD${orderId.slice(0, 5)}`,
            TransactionDesc: `Payment for Order ${orderId.slice(0, 5)}`
        };

        logger.info(`Initiating STK Push to ${this.maskPhone(formattedPhone)} for KES ${amount}`);

        const response = await axios.post(`${baseUrl}/mpesa/stkpush/v1/processrequest`, payload, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000 // 15s timeout
        });

        const order = await this.orderRepo.findOneBy({ id: orderId });
        if (order) {
            const tx = this.transactionRepo.create({
                order: order,
                merchantRequestID: response.data.MerchantRequestID,
                checkoutRequestID: response.data.CheckoutRequestID,
                amount: amount,
                phoneNumber: formattedPhone,
                status: 'PENDING'
            });
            await this.transactionRepo.save(tx);
        }

        return response.data;

    } catch (error: any) {
        const apiMsg = error.response?.data?.errorMessage || error.message;
        logger.error('STK Push Error:', apiMsg);
        throw new Error(`M-Pesa Error: ${apiMsg}`);
    }
  }

  static async handleCallback(body: any) {
    const { stkCallback } = body.Body;
    if (!stkCallback) return;

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    const transaction = await this.transactionRepo.findOne({
      where: { checkoutRequestID: CheckoutRequestID },
      relations: ['order']
    });

    if (!transaction) {
      logger.warn(`Callback ignored: Unknown CheckoutID ${CheckoutRequestID}`);
      return;
    }

    // IDEMPOTENCY CHECK
    // Prevents double-processing if Safaricom sends duplicate callbacks
    if (transaction.status === 'COMPLETED' || transaction.status === 'FAILED') {
        logger.info(`Callback ignored: Transaction ${CheckoutRequestID} already processed as ${transaction.status}`);
        return;
    }

    if (ResultCode === 0) {
      const items = CallbackMetadata.Item;
      const receiptItem = items.find((i: any) => i.Name === 'MpesaReceiptNumber');
      const amountItem = items.find((i: any) => i.Name === 'Amount');
      
      const receiptNumber = receiptItem?.Value;
      const paidAmount = amountItem?.Value;

      // Update Transaction
      transaction.mpesaReceiptNumber = receiptNumber;
      transaction.resultDesc = 'Success';
      transaction.amount = Number(paidAmount); // Update actual amount paid

      // Verify Amount
      if (paidAmount && Number(paidAmount) >= (Number(transaction.order.totalAmount) - 1)) { // Allow 1 KES variance
          transaction.status = 'COMPLETED';
          transaction.order.status = OrderStatus.PAID;
          transaction.order.amountPaid = Number(paidAmount);
          transaction.order.balance = 0;
          logger.info(`✅ Payment Confirmed: ${receiptNumber} (KES ${paidAmount})`);
          
          await this.transactionRepo.save(transaction);
          await this.orderRepo.save(transaction.order);

          // --- TRIGGER SALE CREATION ---
          const fullOrder = await this.orderRepo.findOne({
              where: { id: transaction.order.id },
              relations: ['items', 'items.product']
          });
          
          if (fullOrder) {
              try {
                  await SaleService.createSaleFromOrder(fullOrder);
              } catch (e) {
                  logger.error('Failed to create Sale from M-Pesa order', e);
              }
          }

      } else {
          // Underpayment or Fraud Risk
          transaction.status = 'COMPLETED'; // Transaction technically succeeded
          transaction.order.status = OrderStatus.PARTIALLY_PAID;
          transaction.order.amountPaid = Number(paidAmount || 0);
          transaction.order.balance = Number(transaction.order.totalAmount) - Number(paidAmount || 0);
          
          logger.warn(`⚠️ Partial/Mismatch Payment: ${receiptNumber} (Paid: ${paidAmount}, Expected: ${transaction.order.totalAmount})`);
          
          await this.transactionRepo.save(transaction);
          await this.orderRepo.save(transaction.order);
      }
      
    } else {
      transaction.status = 'FAILED';
      transaction.resultDesc = ResultDesc;
      await this.transactionRepo.save(transaction);
      logger.warn(`❌ Payment Failed: ${ResultDesc} (${this.maskPhone(transaction.phoneNumber)})`);
    }
  }
}
