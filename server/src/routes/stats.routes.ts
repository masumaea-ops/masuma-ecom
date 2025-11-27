
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Sale } from '../entities/Sale';
import { ProductStock } from '../entities/ProductStock';
import { Product } from '../entities/Product';
import { Quote } from '../entities/Quote';
import { authenticate } from '../middleware/auth';
import { MoreThanOrEqual } from 'typeorm';

const router = Router();

// GET /api/admin/stats
router.get('/', authenticate, async (req, res) => {
    try {
        const saleRepo = AppDataSource.getRepository(Sale);
        const stockRepo = AppDataSource.getRepository(ProductStock);
        const quoteRepo = AppDataSource.getRepository(Quote);
        const productRepo = AppDataSource.getRepository(Product);

        // 1. Sales Stats (Aggregated)
        const today = new Date();
        today.setHours(0,0,0,0);

        // Total Revenue (All Time)
        const { allTimeTotal } = await saleRepo.createQueryBuilder('sale')
            .select('SUM(sale.totalAmount)', 'allTimeTotal')
            .getRawOne();

        // Revenue Today (Optional usage)
        const { todayTotal } = await saleRepo.createQueryBuilder('sale')
            .select('SUM(sale.totalAmount)', 'todayTotal')
            .where('sale.createdAt >= :today', { today })
            .getRawOne();

        // Orders/Sales Count Today
        const todaysOrdersCount = await saleRepo.count({
            where: { createdAt: MoreThanOrEqual(today) }
        });

        // 2. Low Stock Items
        const lowStockCount = await stockRepo.createQueryBuilder('stock')
            .where('stock.quantity <= stock.lowStockThreshold')
            .getCount();

        // 3. Pending Quotes
        const pendingQuotes = await quoteRepo.count({ 
            where: { status: 'DRAFT' as any } 
        });

        // 4. Monthly Revenue (Last 6 Months) - Optimized
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        sixMonthsAgo.setDate(1); // Start of that month
        
        const monthlyData = await saleRepo.createQueryBuilder('sale')
            .select("DATE_FORMAT(sale.createdAt, '%Y-%m')", "month")
            .addSelect("SUM(sale.totalAmount)", "revenue")
            .where("sale.createdAt >= :sixMonthsAgo", { sixMonthsAgo })
            .groupBy("month")
            .orderBy("month", "ASC")
            .getRawMany();

        const formattedMonthly = monthlyData.map(d => ({
            name: d.month, 
            value: Number(d.revenue)
        }));

        // 5. Inventory by Category
        const categoryData = await productRepo.createQueryBuilder('product')
            .leftJoin('product.category', 'category')
            .select('category.name', 'name')
            .addSelect('COUNT(product.id)', 'value')
            .groupBy('category.name')
            .getRawMany();

        res.json({
            totalSales: Number(allTimeTotal || 0), // Mapped to All-Time Revenue for Dashboard
            todayRevenue: Number(todayTotal || 0),
            todaysOrders: todaysOrdersCount,
            lowStockItems: lowStockCount,
            pendingQuotes,
            monthlyRevenue: formattedMonthly.length ? formattedMonthly : [
                { name: 'No Data', value: 0 }
            ],
            categorySales: categoryData.map(c => ({ name: c.name, value: Number(c.value) }))
        });
    } catch (error) {
        console.error("Stats API Error:", error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

export default router;
