import 'reflect-metadata';
import path from 'path';
import fs from 'fs'; 

console.log(`\n🚀 [APP] Initializing Masuma ERP Server Module...`);

import { config } from './config/env'; 
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
declare const require: any;

const compression = require('compression'); 
import rateLimit from 'express-rate-limit';
import { AppDataSource } from './config/database';
import { errorHandler } from './middleware/errorHandler'; 
import { httpLogger } from './middleware/httpLogger'; 
import { logger } from './utils/logger';
import { startEmailWorker } from './workers/emailWorker';

// Route Imports
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
import categoryRoutes from './routes/category.routes';
import healthRoutes from './routes/health.routes';
import exchangeRoutes from './routes/exchange.routes';
import vehicleRoutes from './routes/vehicle.routes';
import uploadRoutes from './routes/upload.routes'; 
import financeRoutes from './routes/finance.routes';
import notificationRoutes from './routes/notification.routes';
import newsletterRoutes from './routes/newsletter.routes';

const app = express();
app.set('trust proxy', 1);

AppDataSource.initialize()
  .then(() => {
    logger.info(`✅ Database connected: ${config.DB_NAME}`);
    console.log('👷 [WORKER] Starting background services...');
    startEmailWorker();
  })
  .catch((err) => {
    logger.error('❌ Database connection failed:', err);
  });

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false 
}) as any); 
app.use(compression() as any); 

app.use(cors({ 
  origin: true,
  credentials: true 
}) as any);

app.use(express.json() as any);
app.use(httpLogger as any);

// 1. Static Media serving
app.use('/media', express.static(path.join((process as any).cwd(), 'media')) as any);

// 2. API Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20000,
  message: { error: 'Too many requests' }
});
app.use('/api', limiter as any);

// 3. API ROUTES (Must be registered BEFORE frontend static/catch-all)
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
app.use('/api/categories', categoryRoutes as any);
app.use('/api/health', healthRoutes as any);
app.use('/api/exchange-rates', exchangeRoutes as any);
app.use('/api/vehicles', vehicleRoutes as any);
app.use('/api/upload', uploadRoutes as any);
app.use('/api/finance', financeRoutes as any);
app.use('/api/notifications', notificationRoutes as any);
app.use('/api/newsletter', newsletterRoutes as any);

// 4. FRONTEND SERVING
const possibleDistPaths = [
    path.join((process as any).cwd(), 'dist'),                         
    path.join((process as any).cwd(), '..', 'dist'),                   
    '/home/kemasuma/htdocs/masuma.africa/dist',              
];

let frontendPath = '';
for (const p of possibleDistPaths) {
    if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
        frontendPath = p;
        console.log(`📂 [SERVER] Frontend detected and serving from: ${p}`);
        app.use(express.static(p) as any);
        break;
    }
}

if (!frontendPath) {
    console.warn('⚠️ [SERVER] WARNING: dist folder not found. Website frontend might not load.');
}

// 5. CATCH-ALL
app.get('*', (req: any, res: any) => {
    // If it's an API request that wasn't handled, return 404 JSON
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Endpoint not found' });
    
    // Otherwise serve index.html for SPA routing
    if (frontendPath) {
        const indexPath = path.join(frontendPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    }

    res.status(404).send(`
        <html>
            <head><title>Masuma Africa - Setup Required</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #f9f9f9;">
                <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-top: 5px solid #E0621B;">
                    <h1 style="color: #1A1A1A;">Frontend Build Missing</h1>
                    <p style="color: #666;">The server is running, but the frontend folder (dist) was not found in any expected location.</p>
                </div>
            </body>
        </html>
    `);
});

app.use(errorHandler as any);

const PORT = config.PORT || 3000;
app.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});