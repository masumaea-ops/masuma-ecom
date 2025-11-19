
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
            branchId: req.user!.branch?.id || 'default-branch-id',
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
// Sales History with Pagination and Date Filtering
router.get('/', authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search as string;
        const date = req.query.date as string;

        const query = AppDataSource.getRepository(Sale).createQueryBuilder('sale')
            .leftJoinAndSelect('sale.cashier', 'cashier')
            .leftJoinAndSelect('sale.customer', 'customer')
            .orderBy('sale.createdAt', 'DESC')
            .take(limit)
            .skip(skip);

        // Search Logic
        if (search) {
            query.andWhere('(sale.receiptNumber LIKE :search OR customer.name LIKE :search)', { search: `%${search}%` });
        }

        // Date Logic (Exact Date match for simplicity in UI, or Range if extended)
        if (date) {
             const startOfDay = new Date(date);
             startOfDay.setHours(0,0,0,0);
             const endOfDay = new Date(date);
             endOfDay.setHours(23,59,59,999);
             
             query.andWhere('sale.createdAt BETWEEN :start AND :end', { start: startOfDay, end: endOfDay });
        }

        const [sales, total] = await query.getManyAndCount();

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
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch sales history' });
    }
});

export default router;
