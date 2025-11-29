
import { Router } from 'express';
import { ProductService } from '../services/productService';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';
import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';
import { Category } from '../entities/Category';
import { ProductStock } from '../entities/ProductStock';
import { Branch } from '../entities/Branch';
import { OemNumber } from '../entities/OemNumber';
import { Vehicle } from '../entities/Vehicle'; 
import { createProductSchema, updateProductSchema } from '../schemas/product.schema';

const router = Router();

// GET /api/products
router.get('/', async (req, res) => {
    try {
        const query = req.query.q as string || '';
        const category = req.query.category as string || 'All';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 100;
        
        const result = await ProductService.getAllProducts(query, category, page, limit);
        res.json(result); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/products/sku/:sku
router.get('/sku/:sku', async (req, res) => {
    try {
        const products = await ProductService.getAllProducts(req.params.sku);
        const product = (products as any).data ? (products as any).data.find((p: any) => p.sku === req.params.sku) : null;
        
        if (!product) return res.status(404).json({ error: 'SKU not found' });
        res.json([product]);
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

// POST /api/products (Admin Only)
router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), validate(createProductSchema), async (req, res) => {
    try {
        // Inject branchId from authenticated user to initialize stock
        const payload = { 
            ...req.body, 
            branchId: req.user?.branch?.id 
        };
        
        const product = await ProductService.createProduct(payload);
        res.status(201).json(product);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to create product' });
    }
});

// PUT /api/products/:id (Admin Only)
router.put('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), validate(updateProductSchema), async (req, res) => {
    try {
        // Enable active sync: Pass branchId so stock can be updated alongside details
        const payload = {
            ...req.body,
            branchId: req.user?.branch?.id
        };
        const product = await ProductService.updateProduct(req.params.id, payload);
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

// --- BULK IMPORT ROUTE ---
const bulkImportSchema = z.object({
    branchId: z.string(),
    products: z.array(z.object({
        sku: z.string(),
        name: z.string(),
        category: z.string(),
        // Explicitly check for finite numbers to reject NaN
        price: z.number().finite(),
        costPrice: z.number().finite().optional(),
        wholesalePrice: z.number().finite().optional(),
        description: z.string().optional(),
        oemNumbers: z.string().optional(), 
        compatibility: z.string().optional(),
        quantity: z.number().finite().optional(),
        lowStockThreshold: z.number().finite().optional(),
        imageUrl: z.string().optional()
    }))
});

router.post('/bulk', authenticate, authorize(['ADMIN', 'MANAGER']), validate(bulkImportSchema), async (req, res) => {
    const { branchId, products } = req.body;
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const branch = await queryRunner.manager.findOneBy(Branch, { id: branchId });
        if (!branch) throw new Error('Invalid Branch ID');

        let createdCount = 0;
        let updatedCount = 0;

        for (const item of products) {
            let category = await queryRunner.manager.findOneBy(Category, { name: item.category });
            if (!category) {
                category = queryRunner.manager.create(Category, { name: item.category });
                await queryRunner.manager.save(category);
            }

            let product = await queryRunner.manager.findOneBy(Product, { sku: item.sku });
            
            if (product) {
                product.name = item.name;
                product.price = item.price;
                product.costPrice = item.costPrice || product.costPrice;
                product.wholesalePrice = item.wholesalePrice || product.wholesalePrice;
                product.description = item.description || product.description;
                product.category = category;
                if (item.imageUrl) product.imageUrl = item.imageUrl;
                await queryRunner.manager.save(product);
                updatedCount++;
            } else {
                product = new Product();
                product.sku = item.sku;
                product.name = item.name;
                product.price = item.price;
                product.costPrice = item.costPrice || 0;
                product.wholesalePrice = item.wholesalePrice || item.price;
                product.description = item.description || '';
                product.category = category;
                product.imageUrl = item.imageUrl || '';
                await queryRunner.manager.save(product);
                createdCount++;
            }

            if (item.oemNumbers) {
                await queryRunner.manager.delete(OemNumber, { product: { id: product.id } });
                const oems = item.oemNumbers.split(',').map((code: string) => {
                    const o = new OemNumber();
                    o.code = code.trim();
                    o.product = product!;
                    return o;
                });
                await queryRunner.manager.save(oems);
            }

            if (item.compatibility) {
                const compatStrings = item.compatibility.split(',').map((s: string) => s.trim()).filter((s: string) => s);
                const vehicles = [];
                for (const comp of compatStrings) {
                    const parts = comp.split(' ');
                    const make = parts.length > 1 ? parts[0] : 'Generic';
                    const model = parts.length > 1 ? parts.slice(1).join(' ') : comp;
                    
                    let v = await queryRunner.manager.findOneBy(Vehicle, { make, model });
                    if (!v) {
                        v = queryRunner.manager.create(Vehicle, { make, model });
                        await queryRunner.manager.save(v);
                    }
                    vehicles.push(v);
                }
                product.vehicles = vehicles;
                await queryRunner.manager.save(product);
            }

            if (item.quantity !== undefined) {
                let stock = await queryRunner.manager.findOne(ProductStock, {
                    where: { product: { id: product.id }, branch: { id: branch.id } }
                });

                if (!stock) {
                    stock = new ProductStock();
                    stock.product = product;
                    stock.branch = branch;
                    stock.quantity = 0;
                }
                stock.quantity = item.quantity;
                stock.lowStockThreshold = item.lowStockThreshold || 5;
                await queryRunner.manager.save(stock);
            }
        }

        await queryRunner.commitTransaction();
        res.json({ message: 'Bulk import successful', created: createdCount, updated: updatedCount });

    } catch (error: any) {
        await queryRunner.rollbackTransaction();
        console.error(error);
        res.status(500).json({ error: error.message || 'Bulk import failed' });
    } finally {
        await queryRunner.release();
    }
});

export default router;
