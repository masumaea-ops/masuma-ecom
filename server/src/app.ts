
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Queue } from 'bullmq';
import { redis } from './config/redis';
import { AppDataSource } from './config/database';
import { ProductService } from './services/productService';

// Routers
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import inventoryRoutes from './routes/inventory.routes';
import salesRoutes from './routes/sales.routes';
import customerRoutes from './routes/customer.routes';
import statsRoutes from './routes/stats.routes';
import orderRoutes from './routes/order.routes'; // New

// Services & Legacy handlers (to be refactored later or kept for Mpesa specific logic)
import { MpesaService } from './services/mpesaService';
import { z } from 'zod';
import { Order, OrderStatus } from './entities/Order';
import { OrderItem } from './entities/OrderItem';
import { validate } from './middleware/validate';

const app = express();

// Initialize Database
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });

const emailQueue = new Queue('email-queue', { connection: redis });

// --- Security & Performance Middleware ---
app.use(helmet()); 
app.use(compression()); 
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 300, // Increased for ERP usage
});
app.use('/api', limiter);

// --- Mount Modular Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes); 
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin/stats', statsRoutes);
app.use('/api/orders', orderRoutes); // New Order Management Routes

// --- Legacy / Specific Routes (M-Pesa, Quotes) ---

// Quote Request
const quoteSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    message: z.string().optional(),
    productId: z.string(),
    productName: z.string()
});

app.post('/api/quotes', validate(quoteSchema), async (req, res) => {
    await emailQueue.add('send-email', { type: 'QUOTE_REQUEST', data: req.body });
    res.status(201).json({ message: 'Quote request received' });
});

// M-Pesa (Public)
const mpesaOrderSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
  items: z.array(z.object({ 
    productId: z.string(), 
    quantity: z.number().min(1),
    price: z.number()
  }))
});

app.post('/api/mpesa/pay', validate(mpesaOrderSchema), async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, items } = req.body;
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    const orderRepo = AppDataSource.getRepository(Order);
    const order = new Order();
    order.customerName = customerName;
    order.customerEmail = customerEmail;
    order.customerPhone = customerPhone;
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
    await MpesaService.initiateStkPush(order.id, customerPhone, totalAmount);

    res.status(201).json({ 
      message: 'STK Push initiated', 
      orderId: order.id,
      phone: customerPhone 
    });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Payment initiation failed' });
  }
});

app.post('/api/mpesa/callback', async (req, res) => {
  try {
    await MpesaService.handleCallback(req.body);
    res.json({ result: 'ok' });
  } catch (error) {
    console.error('Callback Error', error);
    res.status(500).json({ error: 'Callback failed' });
  }
});

app.get('/api/orders/:id/status', async (req, res) => {
  try {
    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({
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
app.get('/sitemap.xml', async (req, res) => {
  try {
    const products = await ProductService.getAllProductIdsForSitemap();
    const baseUrl = 'https://masuma.co.ke/product';
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
