
import { Router } from 'express';
import { ProductService } from '../services/productService';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// GET /api/products
router.get('/', async (req, res) => {
    try {
        const query = req.query.q as string || '';
        const category = req.query.category as string || 'All';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        // Use the service which now handles pagination internally or update service signature
        // For now, relying on the existing service structure, but enriching the response
        // Note: Service getAllProducts logic was basic. Reusing it but ignoring pagination 
        // inside service for this specific call to keep consistency, or calling it directly.
        // A better way is to update the Service to accept pagination. 
        // Assuming Service.getAllProducts accepts query, category.
        
        const result = await ProductService.getAllProducts(query, category);
        // Mocking pagination wrapper around result if service doesn't support it yet
        // In previous steps, we updated service to return { data, meta }.
        
        res.json(result); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/products/sku/:sku
router.get('/sku/:sku', async (req, res) => {
    try {
        // Quick lookup for B2B
        const products = await ProductService.getAllProducts(req.params.sku);
        // Filter exact match in memory if service is fuzzy
        const product = (products as any).data ? (products as any).data.find((p: any) => p.sku === req.params.sku) : null;
        
        if (!product) return res.status(404).json({ error: 'SKU not found' });
        res.json([product]); // Return array for consistency
    } catch (error) {
         res.status(500).json({ error: 'Search failed' });
    }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const product = await ProductService.getProductById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Schema for Creating/Updating Product
const productSchema = z.object({
    name: z.string().min(3),
    sku: z.string().min(3),
    price: z.number().positive(),
    costPrice: z.number().min(0).optional(), // Added Cost Price
    wholesalePrice: z.number().optional(),
    description: z.string(),
    category: z.string(),
    imageUrl: z.string().url().optional().or(z.literal('')),
    images: z.array(z.string()).optional(),
    videoUrl: z.string().optional(),
    oemNumbers: z.array(z.string()).optional(),
});

// POST /api/products (Admin Only)
router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), validate(productSchema), async (req, res) => {
    try {
        const product = await ProductService.createProduct(req.body);
        res.status(201).json(product);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to create product' });
    }
});

// PUT /api/products/:id (Admin Only)
router.put('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), validate(productSchema.partial()), async (req, res) => {
    try {
        const product = await ProductService.updateProduct(req.params.id, req.body);
        res.json(product);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to update product' });
    }
});

// DELETE /api/products/:id (Admin Only)
router.delete('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        await ProductService.deleteProduct(req.params.id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to delete product' });
    }
});

export default router;
