
import { Router } from 'express';
import { SaleService } from '../services/saleService';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { Sale } from '../entities/Sale';
import { z } from 'zod';

const router = Router();

const createSaleSchema = z.object({
    items: z.array(z.object({
        productId: z.string(),
        name: z.string(),
        quantity: z.number().min(1),
        price: z.number()
    })),
    totalAmount: z.number(),
    paymentMethod: z.enum(['CASH', 'MPESA', 'CARD', 'CREDIT']),
    customerId: z.string().optional(),
    paymentDetails: z.any().optional()
});

// POST /api/sales
// Process a POS Transaction
router.post('/', authenticate, validate(createSaleSchema), async (req, res) => {
    try {
        const saleData = {
            ...req.body,
            branchId: req.user!.branch?.id || 'default-branch-id', // Fallback for logic
            cashierId: req.user!.id
        };

        const sale = await SaleService.createSale(saleData);
        res.status(201).json(sale);
    } catch (error: any) {
        console.error('Sale Creation Error', error);
        res.status(500).json({ error: error.message || 'Transaction failed' });
    }
});

// GET /api/sales
// Sales History with Pagination
router.get('/', authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const [sales, total] = await AppDataSource.getRepository(Sale).findAndCount({
            order: { createdAt: 'DESC' },
            take: limit,
            skip: skip,
            relations: ['cashier', 'customer']
        });

        res.json({
            data: sales,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sales history' });
    }
});

export default router;
