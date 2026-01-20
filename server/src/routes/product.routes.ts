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
import { createProductSchema, updateProductSchema } from '../schemas/product.schema';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const query = req.query.q as string || '';
        const category = req.query.category as string || 'All';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 100;
        
        const result = await ProductService.getAllProducts(query, category, page, limit);
        res.json(result); 
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

router.post('/bulk/clear-all', authenticate, authorize(['ADMIN']), async (req, res) => {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        await queryRunner.manager.query('SET FOREIGN_KEY_CHECKS = 0');
        await queryRunner.manager.query('DELETE FROM oem_numbers');
        await queryRunner.manager.query('DELETE FROM product_stock');
        await queryRunner.manager.query('DELETE FROM product_vehicles');
        await queryRunner.manager.query('DELETE FROM products');
        await queryRunner.manager.query('SET FOREIGN_KEY_CHECKS = 1');
        await queryRunner.commitTransaction();
        res.json({ message: 'Catalog wiped successfully. Database is now clean.' });
    } catch (error: any) {
        await queryRunner.rollbackTransaction();
        res.status(500).json({ error: 'Failed to clear catalog' });
    } finally {
        await queryRunner.release();
    }
});

router.post('/bulk/delete', authenticate, authorize(['ADMIN', 'MANAGER']), validate(z.object({ ids: z.array(z.string()) })), async (req: any, res) => {
    try {
        await ProductService.bulkDelete(req.body.ids, req.user);
        res.json({ message: `Successfully deleted ${req.body.ids.length} products.` });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Bulk delete failed' });
    }
});

router.delete('/bulk/rollback/:batchId', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
    const { batchId } = req.params;
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        const products = await queryRunner.manager.findBy(Product, { importBatchId: batchId });
        for (const p of products) {
            await queryRunner.manager.delete(ProductStock, { product: { id: p.id } } as any);
            await queryRunner.manager.delete(OemNumber, { product: { id: p.id } } as any);
            await queryRunner.manager.remove(p);
        }
        await queryRunner.commitTransaction();
        res.json({ message: `Successfully rolled back ${products.length} products from batch ${batchId}` });
    } catch (error: any) {
        await queryRunner.rollbackTransaction();
        res.status(500).json({ error: 'Rollback failed' });
    } finally {
        await queryRunner.release();
    }
});

router.post('/adjust-prices', authenticate, authorize(['ADMIN', 'MANAGER']), validate(z.object({ percentage: z.number() })), async (req: any, res) => {
    try {
        const { percentage } = req.body;
        await ProductService.applyGlobalPriceAdjustment(percentage, req.user);
        res.json({ message: `Successfully adjusted all prices by ${percentage}%` });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to adjust prices' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const product = await ProductService.getProductById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), validate(createProductSchema), async (req, res) => {
    try {
        const payload = { ...req.body, branchId: req.user?.branch?.id };
        const product = await ProductService.createProduct(payload);
        res.status(201).json(product);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to create product' });
    }
});

router.put('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), validate(updateProductSchema), async (req, res) => {
    try {
        const payload = { ...req.body, branchId: req.user?.branch?.id };
        const product = await ProductService.updateProduct(req.params.id, payload);
        res.json(product);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to update product' });
    }
});

router.delete('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        await ProductService.deleteProduct(req.params.id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to delete product' });
    }
});

const bulkImportSchema = z.object({
    branchId: z.string(),
    dryRun: z.boolean().optional().default(false),
    products: z.array(z.object({
        sku: z.string(),
        name: z.string(),
        category: z.string(),
        price: z.number().finite(),
        costPrice: z.number().finite().nullable().optional(), 
        wholesalePrice: z.number().finite().nullable().optional(), 
        description: z.string().optional(),
        oemNumbers: z.string().optional(), 
        compatibility: z.string().optional(),
        quantity: z.number().finite().nullable().optional(),
        lowStockThreshold: z.number().finite().nullable().optional(),
        imageUrl: z.string().optional()
    }))
});

router.post('/bulk', authenticate, authorize(['ADMIN', 'MANAGER']), validate(bulkImportSchema), async (req, res) => {
    const { branchId, products, dryRun } = req.body;
    const batchId = `BATCH-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const branch = await queryRunner.manager.findOneBy(Branch, { id: branchId });
        if (!branch) throw new Error('Invalid Branch ID');

        let createdCount = 0;
        let updatedCount = 0;
        const reports: { row: number, sku: string, status: 'CREATED' | 'UPDATED' | 'ERROR', message: string }[] = [];

        for (let i = 0; i < products.length; i++) {
            const item = products[i];
            try {
                const safeSku = item.sku.toString().trim().toUpperCase();
                const safeName = item.name.toString().trim().substring(0, 490);

                if (!safeSku) throw new Error('Missing SKU');

                let category = await queryRunner.manager.findOneBy(Category, { name: item.category });
                if (!category) {
                    category = queryRunner.manager.create(Category, { name: item.category || 'General' });
                    await queryRunner.manager.save(category);
                }

                let product = await queryRunner.manager.findOneBy(Product, { sku: safeSku });
                const price = Number(item.price) || 0;

                if (product) {
                    product.name = safeName;
                    product.price = price;
                    product.costPrice = Number(item.costPrice) || product.costPrice;
                    product.description = item.description || product.description;
                    product.category = category;
                    await queryRunner.manager.save(product);
                    updatedCount++;
                    reports.push({ row: i + 1, sku: safeSku, status: 'UPDATED', message: 'Refreshed existing part.' });
                } else {
                    product = new Product();
                    product.sku = safeSku;
                    product.name = safeName;
                    product.price = price;
                    product.costPrice = Number(item.costPrice) || 0;
                    product.description = item.description || '';
                    product.category = category;
                    product.importBatchId = batchId; // Tag new products for rollback
                    await queryRunner.manager.save(product);
                    createdCount++;
                    reports.push({ row: i + 1, sku: safeSku, status: 'CREATED', message: 'New part added.' });
                }

                if (item.oemNumbers) {
                    await queryRunner.manager.delete(OemNumber, { product: { id: product.id } } as any);
                    const oems = item.oemNumbers.split(',').map((s: string) => s.trim()).filter((s: string) => s).map((code: string) => {
                        const o = new OemNumber();
                        o.code = code.toUpperCase();
                        o.product = product!;
                        return o;
                    });
                    if (oems.length > 0) await queryRunner.manager.save(oems);
                }

                if (item.quantity !== undefined) {
                    let stock = await queryRunner.manager.findOne(ProductStock, {
                        where: { product: { id: product.id } as any, branch: { id: branch.id } as any }
                    });
                    if (!stock) {
                        stock = new ProductStock();
                        stock.product = product;
                        stock.branch = branch;
                    }
                    stock.quantity = Number(item.quantity) || 0;
                    await queryRunner.manager.save(stock);
                }
            } catch (rowError: any) {
                reports.push({ row: i + 1, sku: item.sku, status: 'ERROR', message: rowError.message });
            }
        }

        if (dryRun) {
            await queryRunner.rollbackTransaction();
            res.json({ message: 'Dry run completed.', created: createdCount, updated: updatedCount, reports, isDryRun: true });
        } else {
            await queryRunner.commitTransaction();
            res.json({ message: 'Import finalized.', created: createdCount, updated: updatedCount, reports, batchId, isDryRun: false });
        }
    } catch (error: any) {
        await queryRunner.rollbackTransaction();
        res.status(500).json({ error: error.message || 'Import failed' });
    } finally {
        await queryRunner.release();
    }
});

export default router;