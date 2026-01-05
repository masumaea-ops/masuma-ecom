
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { MpesaTransaction } from '../entities/MpesaTransaction';
import { Order, OrderStatus } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { MpesaService } from '../services/mpesaService';
import { z } from 'zod';
import { logger } from '../utils/logger';

const router = Router();
const mpesaRepo = AppDataSource.getRepository(MpesaTransaction);
const orderRepo = AppDataSource.getRepository(Order);

const mpesaOrderSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.union([z.string().email(), z.string(), z.null(), z.undefined()]).optional(),
  customerPhone: z.string().min(10),
  shippingAddress: z.string().optional(),
  items: z.array(z.object({ 
    productId: z.string(), 
    quantity: z.number().min(1), 
    price: z.number()
  }))
});

// POST /api/mpesa/pay - Integrated to fix 404
router.post('/pay', validate(mpesaOrderSchema), async (req: any, res) => {
  try {
    const { customerName, customerEmail, customerPhone, shippingAddress, items } = req.body;
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    const order = new Order();
    order.orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    order.customerName = customerName;
    order.customerEmail = (customerEmail && customerEmail.trim() !== '') ? customerEmail : undefined;
    order.customerPhone = customerPhone;
    order.shippingAddress = shippingAddress || 'Walk-in / Pickup';
    order.totalAmount = totalAmount;
    order.amountPaid = 0; 
    order.balance = totalAmount;
    order.status = OrderStatus.PENDING;
    
    order.items = items.map((i: any) => {
      const item = new OrderItem();
      item.product = { id: i.productId } as any;
      item.quantity = i.quantity;
      item.price = i.price;
      return item;
    });

    await orderRepo.save(order);
    
    try {
        const response = await MpesaService.initiateStkPush(order.id, customerPhone, totalAmount);
        res.status(201).json({ 
            message: 'STK Push initiated', 
            orderId: order.id,
            orderNumber: order.orderNumber,
            checkoutId: response.CheckoutRequestID
        });
    } catch (mpesaError: any) {
        logger.error('STK Push Error:', mpesaError.message);
        res.status(500).json({ 
            error: mpesaError.message || 'Payment Initiation Failed', 
            orderId: order.id 
        });
    }
  } catch (error: any) {
    logger.error('Mpesa Pay Route Error:', error);
    res.status(400).json({ error: error.message || 'Order creation failed' });
  }
});

// POST /api/mpesa/callback
router.post('/callback', async (req: any, res) => {
  try {
    await MpesaService.handleCallback(req.body);
    res.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (error) {
    res.status(500).json({ error: 'Callback failed' });
  }
});

// GET /api/mpesa/logs
router.get('/logs', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const logs = await mpesaRepo.find({
            order: { createdAt: 'DESC' },
            take: 100,
            relations: ['order']
        });

        const formattedLogs = logs.map(log => ({
            id: log.id,
            checkoutRequestID: log.checkoutRequestID,
            phoneNumber: log.phoneNumber,
            amount: Number(log.amount),
            status: log.status,
            mpesaReceiptNumber: log.mpesaReceiptNumber,
            resultDesc: log.resultDesc,
            date: log.createdAt.toLocaleString()
        }));

        res.json(formattedLogs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch M-Pesa logs' });
    }
});

export default router;
