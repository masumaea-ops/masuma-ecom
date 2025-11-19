import 'reflect-metadata'; // Required for TypeORM
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { ProductService } from './services/productService';
import { MpesaService } from './services/mpesaService';
import { Queue } from 'bullmq';
import { redis } from './config/redis';
import { z } from 'zod';
import { AppDataSource } from './config/database';
import { Order, OrderStatus } from './entities/Order';
import { OrderItem } from './entities/OrderItem';

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
  max: 100, 
});
app.use('/api', limiter);

// --- Routes ---

app.get('/api/products', async (req, res) => {
  try {
    const query = req.query.q as string || '';
    const category = req.query.category as string || 'All';
    const products = await ProductService.getAllProducts(query, category);
    res.set('Cache-Control', 'public, max-age=300'); 
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await ProductService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// 3. POST /api/mpesa/pay - Create Order & Trigger STK Push
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

app.post('/api/mpesa/pay', async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, items } = mpesaOrderSchema.parse(req.body);
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create Order via TypeORM
    const orderRepo = AppDataSource.getRepository(Order);
    const order = new Order();
    order.customerName = customerName;
    order.customerEmail = customerEmail;
    order.customerPhone = customerPhone;
    order.totalAmount = totalAmount;
    order.status = OrderStatus.PENDING;
    order.items = items.map(i => {
      const item = new OrderItem();
      item.product = { id: i.productId } as any; // Relational link
      item.quantity = i.quantity;
      item.price = i.price;
      return item;
    });

    await orderRepo.save(order);

    // 2. Initiate STK Push
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
    console.log('Received M-Pesa Callback');
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

app.post('/api/quotes', async (req, res) => {
  try {
    const quoteSchema = z.object({
        name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(10),
        message: z.string().optional(),
        productId: z.string(),
        productName: z.string()
    });
    const validatedData = quoteSchema.parse(req.body);
    await emailQueue.add('send-email', { type: 'QUOTE_REQUEST', data: validatedData });
    res.status(201).json({ message: 'Quote request received' });
  } catch (error) {
    res.status(400).json({ error: 'Invalid Input' });
  }
});

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
