
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Sale } from '../entities/Sale';
import { ProductStock } from '../entities/ProductStock';
import { Product } from '../entities/Product';
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

        // 4. Monthly Revenue (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const monthlyData = await AppDataSource.getRepository(Sale)
            .createQueryBuilder('sale')
            .select("DATE_FORMAT(sale.createdAt, '%Y-%m')", "month")
            .addSelect("SUM(sale.totalAmount)", "revenue")
            .where("sale.createdAt >= :sixMonthsAgo", { sixMonthsAgo })
            .groupBy("month")
            .orderBy("month", "ASC")
            .getRawMany();

        const formattedMonthly = monthlyData.map(d => ({
            name: d.month, // In real MySQL this might need formatting
            value: Number(d.revenue)
        }));

        // 5. Inventory by Category
        const categoryData = await AppDataSource.getRepository(Product)
            .createQueryBuilder('product')
            .leftJoin('product.category', 'category')
            .select('category.name', 'name')
            .addSelect('COUNT(product.id)', 'value')
            .groupBy('category.name')
            .getRawMany();

        res.json({
            totalSales: totalRevenue,
            todaysOrders: todaysSales.length,
            lowStockItems: lowStockCount,
            pendingQuotes,
            monthlyRevenue: formattedMonthly.length ? formattedMonthly : [
                { name: 'No Data', value: 0 }
            ],
            categorySales: categoryData.map(c => ({ name: c.name, value: Number(c.value) }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

export default router;
