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
import sitemapRoutes from './routes/sitemap.routes';
import importCalculatorRoutes from './routes/import-calculator.routes';
import fraudRoutes from './routes/fraud.routes';
import importRequestRoutes from './routes/import-request.routes';
import analyticsRoutes from './routes/analytics.routes';
import productFeedRoutes from './routes/product-feed.routes';

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

// 2. Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false 
}) as any); 
app.use(compression() as any); 

// Robust CORS for subdomains
const allowedOrigins = [
  'https://masuma.africa',
  'https://shop.masuma.africa',
  'https://admin.masuma.africa',
  'https://pos.masuma.africa',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                     origin.endsWith('.masuma.africa');
                     
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}) as any);

app.use(express.json({ limit: '50mb' }) as any);
app.use(express.urlencoded({ limit: '50mb', extended: true }) as any);
app.use(httpLogger as any);

// 1. Static Media serving
const mediaPath = path.join(process.cwd(), 'media');
if (!fs.existsSync(mediaPath)) fs.mkdirSync(mediaPath, { recursive: true });
app.use('/media', express.static(mediaPath) as any);

// 2. API Rate Limiting - Increased for multiple subdomains
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5000, // Increased from 2000 to accommodate multiple subdomains
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' },
  keyGenerator: (req: any) => {
    // Use X-Forwarded-For if behind a proxy, otherwise fallback to socket address
    return req.headers['x-forwarded-for'] || req.ip;
  }
});
app.use('/api', limiter as any);

// Stricter limiter for Auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 attempts per hour
  message: { error: 'Too many authentication attempts. Please try again in an hour.' }
});
app.use('/api/auth', authLimiter as any);

// 3. API ROUTES (Must be registered BEFORE frontend static/catch-all)
app.use('/api/auth', authRoutes as any);
app.use('/api/products', productRoutes as any); 
app.use('/api/inventory', inventoryRoutes as any);
app.use('/api/sales', salesRoutes as any);
app.use('/api/customers', customerRoutes as any);
app.use('/api/admin/stats', statsRoutes as any);
app.use('/api/orders', orderRoutes as any);
app.use('/api/mpesa', mpesaRoutes as any);
app.use('/sitemap.xml', sitemapRoutes as any);
app.use('/google-product-feed.xml', productFeedRoutes as any);
app.use('/api/blog', blogRoutes as any);
app.use('/api/users', userRoutes as any); 
app.use('/api/audit-logs', auditRoutes as any); 
app.use('/api/settings', settingsRoutes as any); 
app.use('/api/quotes', quoteRoutes as any);
app.use('/api/reports', reportRoutes as any);
app.use('/api/contact', rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 messages per hour
  message: { error: 'Too many messages. Please try again later.' }
}) as any, contactRoutes as any); 
app.use('/api/branches', branchRoutes as any); 
app.use('/api/categories', categoryRoutes as any);
app.use('/api/returns', returnRoutes as any);
app.use('/api/health', healthRoutes as any);
app.use('/api/exchange-rates', exchangeRoutes as any);
app.use('/api/vehicles', vehicleRoutes as any);
app.use('/api/upload', uploadRoutes as any);
app.use('/api/finance', financeRoutes as any);
app.use('/api/notifications', notificationRoutes as any);
app.use('/api/newsletter', rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 signups per hour
  message: { error: 'Too many subscription attempts. Please try again later.' }
}) as any, newsletterRoutes as any);
app.use('/api/marketplace', marketplaceRoutes as any);
app.use('/api/import-calculator', importCalculatorRoutes as any);
app.use('/api/fraud', fraudRoutes as any);
app.use('/api/import-requests', importRequestRoutes as any);
app.use('/api/analytics', analyticsRoutes as any);

// 3.5 Technical SEO Routes
app.get('/robots.txt', (req, res) => {
    const protocol = req.get('x-forwarded-proto') || (req.get('host')?.includes('masuma.africa') ? 'https' : req.protocol);
    const host = req.get('host');
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /login
Sitemap: ${protocol}://${host}/sitemap.xml
Sitemap: ${protocol}://${host}/google-product-feed.xml`);
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
        app.use(express.static(p, { index: false }) as any);
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
                
                const sanitizeId = (val: any) => typeof val === 'string' ? val.replace(/[?/,!]$/g, '').trim() : '';
                const postId = sanitizeId(req.query.post);
                const productId = sanitizeId(req.query.product);
                const listingId = sanitizeId(req.query.listing);
                const viewParam = req.query.view as string;

                let metaData: any = null;
                const protocol = req.get('x-forwarded-proto') || (req.get('host')?.includes('masuma.africa') ? 'https' : req.protocol);
                const baseUrl = `${protocol}://${req.get('host')}`;

                if (postId) {
                    try {
                        const postRepo = AppDataSource.getRepository(BlogPost);
                        const post = await postRepo.findOneBy({ id: postId });
                        if (post) {
                            metaData = {
                                title: post.title,
                                description: post.excerpt || post.content.substring(0, 160).replace(/<[^>]*>/g, '') + '...',
                                image: post.image ? (post.image.startsWith('http') ? post.image : `${baseUrl}${post.image}`) : `${baseUrl}/og-image.jpg`,
                                url: `${baseUrl}${req.originalUrl}`,
                                type: 'article'
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
                                image: product.imageUrl ? (product.imageUrl.startsWith('http') ? product.imageUrl : `${baseUrl}${product.imageUrl}`) : `${baseUrl}/og-image.jpg`,
                                url: `${baseUrl}${req.originalUrl}`,
                                sku: product.sku,
                                price: product.price,
                                availability: totalStock > 0 ? 'InStock' : 'OutOfStock',
                                type: 'product'
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
                                image: listing.images && listing.images.length > 0 ? (listing.images[0].startsWith('http') ? listing.images[0] : `${baseUrl}${listing.images[0]}`) : `${baseUrl}/og-image.jpg`,
                                url: `${baseUrl}${req.originalUrl}`,
                                type: 'product'
                            };
                        }
                    } catch (e) {
                        console.error('Error fetching listing for meta:', e);
                    }
                } else {
                    // Static Views Fallback
                    const viewTitles: Record<string, { t: string, d: string }> = {
                        'CATALOG': { t: 'Products Catalog', d: 'Browse over 10,000+ genuine Japanese spare parts.' },
                        'ABOUT': { t: 'About Us', d: 'Masuma Autoparts East Africa - Official Japanese parts distributor.' },
                        'CONTACT': { t: 'Contact Us', d: 'Get in touch with our Nairobi head office for genuine part inquiries.' },
                        'MARKETPLACE': { t: 'Vehicle Marketplace', d: 'Buy and sell verified cars and motorcycles in Kenya.' },
                        'IMPORT_CALCULATOR': { t: 'Import Duty Calculator', d: 'Calculate total taxes and duty for importing vehicles to Kenya.' },
                        'WARRANTY': { t: 'Warranty Policy', d: 'Learn about our industry-leading 12-month warranty on all parts.' }
                    };

                    const viewData = viewParam ? viewTitles[viewParam as string] : null;
                    metaData = {
                        title: viewData ? viewData.t : 'Genuine Japanese Spare Parts Nairobi',
                        description: viewData ? viewData.d : 'Official Masuma distributor in Kenya. Filters, Brakes, Suspension & Spark Plugs.',
                        image: `${baseUrl}/og-image.jpg`,
                        url: `${baseUrl}${req.originalUrl}`,
                        type: 'website'
                    };
                }

                if (metaData) {
                    // Sanitize data
                    const cleanTitle = (metaData.title || 'Masuma Africa').replace(/<[^>]*>/g, '').trim();
                    const cleanDesc = (metaData.description || 'Genuine Japanese Autoparts').replace(/<[^>]*>/g, '').substring(0, 160).trim();
                    const cleanImage = metaData.image || `${baseUrl}/og-image.jpg`;
                    const cleanUrl = metaData.url || baseUrl;
                    const ogType = metaData.type || 'website';

                    // 1. Replace Title & Meta Description
                    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${cleanTitle} | Masuma Africa</title>`);
                    html = html.replace(/<meta name="description" content=".*?"\s*\/?>/i, `<meta name="description" content="${cleanDesc}" />`);
                    
                    // 2. Remove existing OG/Twitter/Canonical tags to avoid duplicates
                    html = html.replace(/<meta property=["']og:.*?["'] content=["'].*?["']\s*\/?>/gi, '');
                    html = html.replace(/<meta name=["']twitter:.*?["'] content=["'].*?["']\s*\/?>/gi, '');
                    html = html.replace(/<link rel=["']canonical["'] href=["'].*?["']\s*\/?>/gi, '');
                    
                    let seoTags = `
    <link rel="canonical" href="${cleanUrl}" />
    <meta property="og:title" content="${cleanTitle}" />
    <meta property="og:description" content="${cleanDesc}" />
    <meta property="og:image" content="${cleanImage}" />
    <meta property="og:url" content="${cleanUrl}" />
    <meta property="og:site_name" content="Masuma Africa" />
    <meta property="og:type" content="${ogType}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${cleanTitle}" />
    <meta name="twitter:description" content="${cleanDesc}" />
    <meta name="twitter:image" content="${cleanImage}" />
`;

                    if (productId && (metaData as any).sku) {
                        const productSchema = {
                            "@context": "https://schema.org/",
                            "@type": "Product",
                            "name": cleanTitle,
                            "image": cleanImage,
                            "description": cleanDesc,
                            "sku": (metaData as any).sku,
                            "brand": {
                                "@type": "Brand",
                                "name": "Masuma"
                            },
                            "offers": {
                                "@type": "Offer",
                                "url": cleanUrl,
                                "priceCurrency": "KES",
                                "price": (metaData as any).price,
                                "availability": `https://schema.org/${(metaData as any).availability}`,
                                "itemCondition": "https://schema.org/NewCondition"
                            }
                        };
                        seoTags += `\n    <script type="application/ld+json">${JSON.stringify(productSchema)}</script>`;
                    }

                    html = html.replace('</head>', `${seoTags}</head>`);
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