
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { VehicleListing, ListingStatus } from '../entities/VehicleListing';
import { BlogPost } from '../entities/BlogPost';
import { Product } from '../entities/Product';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const listingRepo = AppDataSource.getRepository(VehicleListing);
        const blogRepo = AppDataSource.getRepository(BlogPost);
        const productRepo = AppDataSource.getRepository(Product);

        const [listings, posts, products] = await Promise.all([
            listingRepo.find({ where: { status: ListingStatus.ACTIVE }, select: ['id', 'updatedAt'] }),
            blogRepo.find({ select: ['id', 'updatedAt'] }),
            productRepo.find({ select: ['id', 'updatedAt'] })
        ]);

        const baseUrl = 'https://masuma.africa';
        const today = new Date().toISOString().split('T')[0];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/?view=CATALOG</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/?view=PART_FINDER</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/?view=BLOG</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/?view=MARKETPLACE</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/?view=IMPORT_CALCULATOR</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/?view=ABOUT</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/?view=CONTACT</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/?view=PRIVACY</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/?view=TERMS</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/?view=COOKIES</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/?view=WARRANTY</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>`;

        // Add Marketplace Listings
        listings.forEach(listing => {
            const lastMod = listing.updatedAt ? new Date(listing.updatedAt).toISOString().split('T')[0] : today;
            xml += `
  <url>
    <loc>${baseUrl}/?view=MARKETPLACE&amp;listing=${listing.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        });

        // Add Blog Posts
        posts.forEach(post => {
            const lastMod = post.updatedAt ? new Date(post.updatedAt).toISOString().split('T')[0] : today;
            xml += `
  <url>
    <loc>${baseUrl}/?post=${post.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
        });

        // Add Products (Spare Parts)
        products.forEach(product => {
            const lastMod = product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : today;
            xml += `
  <url>
    <loc>${baseUrl}/?product=${product.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        });

        xml += '\n</urlset>';

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (error) {
        console.error('Sitemap Generation Error:', error);
        res.status(500).send('Error generating sitemap');
    }
});

export default router;
