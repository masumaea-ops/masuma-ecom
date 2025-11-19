
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Sale } from '../entities/Sale';
import { ProductStock } from '../entities/ProductStock';
import { Quote } from '../entities/Quote';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/admin/stats
router.get('/', authenticate, async (req, res) => {
    try {
        // 1. Total Sales Today
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const todaysSales = await AppDataSource.getRepository(Sale)
            .createQueryBuilder('sale')
            .where('sale.createdAt >= :today', { today })
            .getMany();
            
        const totalRevenue = todaysSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

        // 2. Low Stock Items
        const lowStockCount = await AppDataSource.getRepository(ProductStock)
            .createQueryBuilder('stock')
            .where('stock.quantity <= stock.lowStockThreshold')
            .getCount();

        // 3. Pending Quotes
        const pendingQuotes = await AppDataSource.getRepository(Quote)
            .count({ where: { status: 'DRAFT' as any } });

        res.json({
            totalSales: totalRevenue,
            todaysOrders: todaysSales.length,
            lowStockItems: lowStockCount,
            pendingQuotes
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

export default router;
