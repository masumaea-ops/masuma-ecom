
import 'reflect-metadata';
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
// FIX: Use require for compression to bypass TS errors in some environments
declare const require: any;
const compression = require('compression'); 
import rateLimit from 'express-rate-limit';
import path from 'path';
import { redis } from './config/redis';
import { AppDataSource } from './config/database';
import { config } from './config/env'; 
import { errorHandler } from './middleware/errorHandler'; 
import { httpLogger } from './middleware/httpLogger'; 
import { logger } from './utils/logger';
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

// CRITICAL: Enable Trust Proxy for correct protocol detection in production (uploads, rate limiting)
// 'loopback' only trusts localhost, use '1' or boolean true if behind a single proxy like Nginx/Heroku
app.set('trust proxy', 1);

// Initialize Database
AppDataSource.initialize()
  .then(() => {
    logger.info(`✅ Database connected: ${config.DB_NAME} on ${config.DB_HOST}`);
  })
  .catch((err) => {
    logger.error('❌ Database connection failed:', err);
    (process as any).exit(1);
  });

// --- Security & Performance Middleware ---
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disabled for flexibility with external scripts/images in this demo
}) as any); 
app.use(compression() as any); 

// FIX: CORS Configuration
app.use(cors({ 
  origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN, 
  credentials: true 
}) as any);

app.use(express.json() as any);

// --- Logging Middleware (Must be before routes) ---
app.use(httpLogger as any);

// --- Static Files (MEDIA FOLDER) ---
// Serve uploaded files
app.use('/media', express.static(path.join((process as any).cwd(), 'media')) as any);

// --- Rate Limiting Strategy ---
const isProduction = config.NODE_ENV === 'production';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: isProduction ? 300 : 20000, // Increased limit for robust ERP usage
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: any) => req.path.startsWith('/api/exchange-rates') || req.path.startsWith('/api/health') || req.path.startsWith('/media'),
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter as any);

// --- Mount Modular Routes ---
app.use('/api/auth', authRoutes as any);
app.use('/api/products', productRoutes as any); 
app.use('/api/inventory', inventoryRoutes as any);
app.use('/api/sales', salesRoutes as any);
app.use('/api/customers', customerRoutes as any);
app.use('/api/admin/stats', statsRoutes as any);
app.use('/api/orders', orderRoutes as any);
app.use('/api/mpesa', mpesaRoutes as any);
app.use('/api/blog', blogRoutes as any);
app.use('/api/users', userRoutes as any); 
app.use('/api/audit-logs', auditRoutes as any); 
app.use('/api/settings', settingsRoutes as any); 
app.use('/api/quotes', quoteRoutes as any);
app.use('/api/reports', reportRoutes as any);
app.use('/api/contact', contactRoutes as any); 
app.use('/api/branches', branchRoutes as any); 
app.use('/api/notifications', notificationRoutes as any); 
app.use('/api/categories', categoryRoutes as any);
app.use('/api/health', healthRoutes as any);
app.use('/api/exchange-rates', exchangeRoutes as any);
app.use('/api/vehicles', vehicleRoutes as any);
app.use('/api/upload', uploadRoutes as any);
app.use('/api/finance', financeRoutes as any);

// Legacy M-Pesa Route
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

app.post('/api/mpesa/pay', validate(mpesaOrderSchema) as any, async (req: any, res: any) => {
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
        // Success
        res.status(201).json({ message: 'STK Push initiated', orderId: order.id });
    } catch (mpesaError: any) {
        logger.error('STK Error:', mpesaError.message);
        // CRITICAL FIX: Return 500 status code so frontend detects failure immediately
        res.status(500).json({ 
            error: mpesaError.message || 'Payment Initiation Failed', 
            orderId: order.id 
        });
    }

  } catch (error: any) {
    logger.error('Order Error', error);
    res.status(400).json({ error: error.message || 'Order creation failed' });
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

// 404 Handler
app.use((req: any, res: any) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler (Registers Logger)
app.use(errorHandler as any);

const PORT = config.PORT;
// BIND TO 0.0.0.0 to ensure Docker/Network access
const server = app.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${PORT} in ${config.NODE_ENV} mode`);
});

server.on('error', (e: any) => {
  if (e.code === 'EADDRINUSE') {
    logger.error(`\n❌ ERROR: Port ${PORT} is already in use.`);
    (process as any).exit(1);
  }
});

// Graceful Shutdown
const shutdown = async () => {
    logger.info('🛑 Shutting down...');
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
