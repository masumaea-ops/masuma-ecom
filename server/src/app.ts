
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { ProductService } from './services/productService';
import { Queue } from 'bullmq';
import { redis } from './config/redis';
import { z } from 'zod';

const app = express();
const emailQueue = new Queue('email-queue', { connection: redis });

// --- Security & Performance Middleware ---
app.use(helmet()); // Secure HTTP headers
app.use(compression()); // Gzip compression for SEO/Performance
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Rate Limiting (DDoS protection)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// --- Routes ---

// 1. GET /api/products - Search & Filter
app.get('/api/products', async (req, res) => {
  try {
    const query = req.query.q as string || '';
    const category = req.query.category as string || 'All';
    
    const products = await ProductService.getAllProducts(query, category);
    
    // Add Cache-Control header for downstream CDNs/Browsers
    res.set('Cache-Control', 'public, max-age=300'); 
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. GET /api/products/:id - Details
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await ProductService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// 3. POST /api/orders - Create Order (Async Processing)
const orderSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().min(1) }))
});

app.post('/api/orders', async (req, res) => {
  try {
    const validatedData = orderSchema.parse(req.body);

    // In a real app, you would save to DB via Prisma here first
    // const order = await prisma.order.create(...)

    // Offload email sending to background worker
    await emailQueue.add('send-email', {
      type: 'ORDER_CONFIRMATION',
      data: {
        orderId: 'temp-id-123', // Replace with real ID
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail
      }
    });

    res.status(201).json({ message: 'Order received', orderId: 'temp-id-123' });
  } catch (error) {
    res.status(400).json({ error: 'Invalid Input' });
  }
});

// 4. POST /api/quotes - Request a Quote
const quoteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  message: z.string().optional(),
  productId: z.string(),
  productName: z.string()
});

app.post('/api/quotes', async (req, res) => {
  try {
    const validatedData = quoteSchema.parse(req.body);

    // Offload to worker
    await emailQueue.add('send-email', {
      type: 'QUOTE_REQUEST',
      data: validatedData
    });

    res.status(201).json({ message: 'Quote request received' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Invalid Input' });
  }
});

// 5. GET /sitemap.xml - SEO Dynamic Sitemap
app.get('/sitemap.xml', async (req, res) => {
  try {
    const products = await ProductService.getAllProductIdsForSitemap();
    const baseUrl = 'https://masuma.co.ke/product';
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    products.forEach(p => {
      xml += `
        <url>
          <loc>${baseUrl}/${p.id}</loc>
          <lastmod>${p.updatedAt.toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>`;
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
