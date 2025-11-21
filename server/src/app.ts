
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
// FIX: Use require for compression to bypass TS errors
const compression = require('compression'); 
import rateLimit from 'express-rate-limit';
import path from 'path';
import { redis } from './config/redis';
import { AppDataSource } from './config/database';
import { config } from './config/env'; 
import { errorHandler } from './middleware/errorHandler'; 
import { ProductService } from './services/productService';

// Routers
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import inventoryRoutes from './routes/inventory.routes';
import salesRoutes from './routes/sales.routes';
import customerRoutes from './routes/customer.routes';
import statsRoutes from './routes/stats.routes';
import orderRoutes from './routes/order.routes';
import mpesaRoutes from './routes/mpesa.routes';
import blogRoutes from './routes/blog.routes';
import userRoutes from './routes/user.routes'; 
import auditRoutes from './routes/audit.routes'; 
import settingsRoutes from './routes/settings.routes'; 
import quoteRoutes from './routes/quote.routes';
import reportRoutes from './routes/report.routes'; 
import contactRoutes from './routes/contact.routes'; 
import branchRoutes from './routes/branch.routes'; 
import notificationRoutes from './routes/notification.routes'; 
import categoryRoutes from './routes/category.routes';
import healthRoutes from './routes/health.routes';
import exchangeRoutes from './routes/exchange.routes';
import vehicleRoutes from './routes/vehicle.routes';
import uploadRoutes from './routes/upload.routes'; 
import financeRoutes from './routes/finance.routes';

import { MpesaService } from './services/mpesaService';
import { z } from 'zod';
import { Order, OrderStatus } from './entities/Order';
import { OrderItem } from './entities/OrderItem';
import { validate } from './middleware/validate';

const app = express();

// Initialize Database
AppDataSource.initialize()
  .then(() => {
    console.log(`✅ Database connected: ${config.DB_NAME} on ${config.DB_HOST}`);
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
    (process as any).exit(1);
  });

// --- Security & Performance Middleware ---
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } 
}) as any); 
app.use(compression()); 
app.use(cors({ origin: config.CORS_ORIGIN }) as any);
app.use(express.json() as any);

// --- Static Files ---
app.use('/uploads', express.static(path.join((process as any).cwd(), 'uploads')) as any);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 300, 
});
app.use('/api', limiter as any);

// --- Mount Modular Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes); 
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin/stats', statsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/audit-logs', auditRoutes); 
app.use('/api/settings', settingsRoutes); 
app.use('/api/quotes', quoteRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/contact', contactRoutes); 
app.use('/api/branches', branchRoutes); 
app.use('/api/notifications', notificationRoutes); 
app.use('/api/categories', categoryRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/exchange-rates', exchangeRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/finance', financeRoutes);

// Legacy M-Pesa Route (Preserved)
const mpesaOrderSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
  shippingAddress: z.string().optional(),
  items: z.array(z.object({ 
    productId: z.string(), 
    quantity: z.number().min(1), 
    price: z.number()
  }))
});

app.post('/api/mpesa/pay', validate(mpesaOrderSchema), async (req: any, res: any) => {
  try {
    const { customerName, customerEmail, customerPhone, shippingAddress, items } = req.body;
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    const orderRepo = AppDataSource.getRepository(Order);
    const order = new Order();
    order.orderNumber = `ORD-${Date.now()}`;
    order.customerName = customerName;
    order.customerEmail = customerEmail;
    order.customerPhone = customerPhone;
    order.shippingAddress = shippingAddress || 'Walk-in / Pickup';
    order.totalAmount = totalAmount;
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
        await MpesaService.initiateStkPush(order.id, customerPhone, totalAmount);
        res.status(201).json({ message: 'STK Push initiated', orderId: order.id });
    } catch (mpesaError: any) {
        console.error('STK Error:', mpesaError.message);
        res.status(201).json({ message: 'Order created but Payment Initiation Failed (Check Settings)', orderId: order.id });
    }

  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Payment initiation failed' });
  }
});

app.post('/api/mpesa/callback', async (req: any, res: any) => {
  try {
    await MpesaService.handleCallback(req.body);
    res.json({ result: 'ok' });
  } catch (error) {
    res.status(500).json({ error: 'Callback failed' });
  }
});

app.get('/api/orders/:id/status', async (req: any, res: any) => {
  try {
    const order = await AppDataSource.getRepository(Order).findOne({
      where: { id: req.params.id },
      select: ['status']
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ status: order.status });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Sitemap
app.get('/sitemap.xml', async (req: any, res: any) => {
  try {
    const products = await ProductService.getAllProductIdsForSitemap();
    const baseUrl = 'https://masuma.africa/product';
    let xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    products.forEach(p => {
      xml += `<url><loc>${baseUrl}/${p.id}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    });
    xml += `</urlset>`;
    res.header('Content-Type', 'text/xml');
    res.send(xml);
  } catch (error) {
    res.status(500).end();
  }
});

// 404
app.use((req: any, res: any) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use(errorHandler as any);

const PORT = config.PORT;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

server.on('error', (e: any) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n❌ ERROR: Port ${PORT} is already in use.`);
    (process as any).exit(1);
  }
});

// Graceful Shutdown
const shutdown = async () => {
    console.log('🛑 Shutting down...');
    setTimeout(() => {
        console.error('⚠️ Force shutdown...');
        (process as any).exit(1);
    }, 10000);

    server.close(async () => {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
        if (redis) {
            redis.disconnect();
            console.log('Redis closed.');
        }
        (process as any).exit(0);
    });
};

(process as any).on('SIGTERM', shutdown);
(process as any).on('SIGINT', shutdown);
