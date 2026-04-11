import 'reflect-metadata';
import path from 'path';
import fs from 'fs'; 

console.log(`\n🚀 [APP] Initializing Masuma ERP Server Module...`);

import { config } from './config/env'; 
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
declare const require: any;

import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { AppDataSource } from './config/database';
import { BlogPost } from './entities/BlogPost';
import { Product } from './entities/Product';
import { VehicleListing } from './entities/VehicleListing';
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
import returnRoutes from './routes/return.routes';
import healthRoutes from './routes/health.routes';
import exchangeRoutes from './routes/exchange.routes';
import vehicleRoutes from './routes/vehicle.routes';
import uploadRoutes from './routes/upload.routes'; 
import financeRoutes from './routes/finance.routes';
import notificationRoutes from './routes/notification.routes';
import newsletterRoutes from './routes/newsletter.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import importCalculatorRoutes from './routes/import-calculator.routes';
import fraudRoutes from './routes/fraud.routes';
import importRequestRoutes from './routes/import-request.routes';
import analyticsRoutes from './routes/analytics.routes';

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

app.use(express.json({ limit: '50mb' }) as any);
app.use(express.urlencoded({ limit: '50mb', extended: true }) as any);
app.use(httpLogger as any);

// 1. Static Media serving
const mediaPath = path.join(process.cwd(), 'media');
if (!fs.existsSync(mediaPath)) fs.mkdirSync(mediaPath, { recursive: true });
app.use('/media', express.static(mediaPath) as any);

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
app.use('/api/returns', returnRoutes as any);
app.use('/api/health', healthRoutes as any);
app.use('/api/exchange-rates', exchangeRoutes as any);
app.use('/api/vehicles', vehicleRoutes as any);
app.use('/api/upload', uploadRoutes as any);
app.use('/api/finance', financeRoutes as any);
app.use('/api/notifications', notificationRoutes as any);
app.use('/api/newsletter', newsletterRoutes as any);
app.use('/api/marketplace', marketplaceRoutes as any);
app.use('/api/import-calculator', importCalculatorRoutes as any);
app.use('/api/fraud', fraudRoutes as any);
app.use('/api/import-requests', importRequestRoutes as any);
app.use('/api/analytics', analyticsRoutes as any);

// 3.5 Technical SEO Routes
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /login
Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`);
});

app.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const productRepo = AppDataSource.getRepository(Product);
        const postRepo = AppDataSource.getRepository(BlogPost);
        
        const products = await productRepo.find({ select: ['id', 'updatedAt'] });
        const posts = await postRepo.find({ select: ['id', 'updatedAt'] });

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><priority>1.0</priority></url>
  <url><loc>${baseUrl}/?view=CATALOG</loc><priority>0.9</priority></url>
  <url><loc>${baseUrl}/?view=ABOUT</loc><priority>0.7</priority></url>
  <url><loc>${baseUrl}/?view=CONTACT</loc><priority>0.7</priority></url>
  <url><loc>${baseUrl}/?view=BLOG</loc><priority>0.8</priority></url>`;

        products.forEach(p => {
            xml += `\n  <url><loc>${baseUrl}/?product=${p.id}</loc><lastmod>${p.updatedAt.toISOString().split('T')[0]}</lastmod><priority>0.8</priority></url>`;
        });

        posts.forEach(p => {
            xml += `\n  <url><loc>${baseUrl}/?post=${p.id}</loc><lastmod>${p.updatedAt.toISOString().split('T')[0]}</lastmod><priority>0.7</priority></url>`;
        });

        xml += '\n</urlset>';
        res.type('application/xml');
        res.send(xml);
    } catch (e) {
        res.status(500).send('Error generating sitemap');
    }
});

// 4. FRONTEND SERVING
const possibleDistPaths = [
    path.join((process as any).cwd(), 'dist'),                         
    path.join((process as any).cwd(), '..', 'dist'),                   
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
app.get('*all', async (req: any, res: any) => {
    // If it's an API request that wasn't handled, return 404 JSON
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Endpoint not found' });
    
    // Otherwise serve index.html for SPA routing
    if (frontendPath) {
        const indexPath = path.join(frontendPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            try {
                let html = fs.readFileSync(indexPath, 'utf8');
                
                const postId = req.query.post;
                const productId = req.query.product;
                const listingId = req.query.listing;
                
                let metaData = null;
                const baseUrl = `${req.protocol}://${req.get('host')}`;

                if (postId) {
                    try {
                        const postRepo = AppDataSource.getRepository(BlogPost);
                        const post = await postRepo.findOneBy({ id: postId });
                        if (post) {
                            metaData = {
                                title: post.title,
                                description: post.excerpt || post.content.substring(0, 160).replace(/<[^>]*>/g, '') + '...',
                                image: post.image ? (post.image.startsWith('http') ? post.image : `${baseUrl}${post.image}`) : `${baseUrl}/logo.png`,
                                url: `${baseUrl}${req.originalUrl}`
                            };
                        }
                    } catch (e) {
                        console.error('Error fetching post for meta:', e);
                    }
                } else if (productId) {
                    try {
                        const productRepo = AppDataSource.getRepository(Product);
                        const product = await productRepo.findOne({ 
                            where: { id: productId },
                            relations: ['stock']
                        });
                        if (product) {
                            const totalStock = (product.stock || []).reduce((acc, s) => acc + s.quantity, 0);
                            metaData = {
                                title: product.name,
                                description: product.description ? product.description.substring(0, 160).replace(/<[^>]*>/g, '') + '...' : 'Premium Autoparts',
                                image: product.imageUrl ? (product.imageUrl.startsWith('http') ? product.imageUrl : `${baseUrl}${product.imageUrl}`) : `${baseUrl}/logo.png`,
                                url: `${baseUrl}${req.originalUrl}`,
                                sku: product.sku,
                                price: product.price,
                                availability: totalStock > 0 ? 'InStock' : 'OutOfStock'
                            };
                        }
                    } catch (e) {
                        console.error('Error fetching product for meta:', e);
                    }
                } else if (listingId) {
                    try {
                        const listingRepo = AppDataSource.getRepository(VehicleListing);
                        const listing = await listingRepo.findOne({ 
                            where: { id: listingId },
                            relations: ['seller']
                        });
                        if (listing) {
                            metaData = {
                                title: `${listing.year} ${listing.make} ${listing.model}`,
                                description: listing.description ? listing.description.substring(0, 160) : `Verified ${listing.make} ${listing.model} for sale in Kenya.`,
                                image: listing.images && listing.images.length > 0 ? (listing.images[0].startsWith('http') ? listing.images[0] : `${baseUrl}${listing.images[0]}`) : `${baseUrl}/logo.png`,
                                url: `${baseUrl}${req.originalUrl}`
                            };
                        }
                    } catch (e) {
                        console.error('Error fetching listing for meta:', e);
                    }
                }

                if (metaData) {
                    // Inject dynamic meta tags
                    html = html.replace(/<title>.*?<\/title>/, `<title>${metaData.title} | Masuma Africa</title>`);
                    html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${metaData.description}" />`);
                    
                    let ogTags = `
    <meta property="og:title" content="${metaData.title}" />
    <meta property="og:description" content="${metaData.description}" />
    <meta property="og:image" content="${metaData.image}" />
    <meta property="og:url" content="${metaData.url}" />
    <meta property="og:site_name" content="Masuma Africa" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${metaData.title}" />
    <meta name="twitter:description" content="${metaData.description}" />
    <meta name="twitter:image" content="${metaData.image}" />
`;

                    if (productId && (metaData as any).sku) {
                        const productSchema = {
                            "@context": "https://schema.org/",
                            "@type": "Product",
                            "name": metaData.title,
                            "image": metaData.image,
                            "description": metaData.description,
                            "sku": (metaData as any).sku,
                            "brand": {
                                "@type": "Brand",
                                "name": "Masuma"
                            },
                            "offers": {
                                "@type": "Offer",
                                "url": metaData.url,
                                "priceCurrency": "KES",
                                "price": (metaData as any).price,
                                "availability": `https://schema.org/${(metaData as any).availability}`,
                                "itemCondition": "https://schema.org/NewCondition"
                            }
                        };
                        ogTags += `\n    <script type="application/ld+json">${JSON.stringify(productSchema)}</script>`;
                    }

                    html = html.replace('</head>', `${ogTags}</head>`);
                }

                return res.send(html);
            } catch (err) {
                console.error('Error serving dynamic index.html:', err);
                return res.sendFile(indexPath);
            }
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