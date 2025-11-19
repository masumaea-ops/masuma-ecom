
import { Router } from 'express';
import { ProductService } from '../services/productService';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

// GET /api/products
router.get('/', async (req, res) => {
    try {
        const query = req.query.q as string || '';
        const category = req.query.category as string || 'All';
        const products = await ProductService.getAllProducts(query, category);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
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

// POST /api/products (Admin Only - Stub)
const createProductSchema = z.object({
    name: z.string(),
    sku: z.string(),
    price: z.number(),
    description: z.string(),
    categoryId: z.string()
});

router.post('/', validate(createProductSchema), async (req, res) => {
    // Implementation for creating product
    res.status(501).json({ message: 'Not implemented yet' });
});

export default router;
