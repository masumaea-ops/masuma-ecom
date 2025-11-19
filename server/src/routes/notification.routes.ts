
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { ProductStock } from '../entities/ProductStock';
import { Order, OrderStatus } from '../entities/Order';
import { Quote, QuoteStatus } from '../entities/Quote';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const notifications = [];

        // 1. Low Stock Alerts
        const lowStockItems = await AppDataSource.getRepository(ProductStock)
            .createQueryBuilder('stock')
            .leftJoinAndSelect('stock.product', 'product')
            .leftJoinAndSelect('stock.branch', 'branch')
            .where('stock.quantity <= stock.lowStockThreshold')
            .take(5)
            .getMany();

        lowStockItems.forEach(item => {
            notifications.push({
                id: `stock-${item.id}`,
                title: 'Low Stock Alert',
                message: `${item.product.name} is low (${item.quantity} left) at ${item.branch.name}.`,
                type: 'warning',
                time: 'Live',
                link: 'inventory'
            });
        });

        // 2. Pending Orders
        const pendingOrdersCount = await AppDataSource.getRepository(Order)
            .count({ where: { status: OrderStatus.PENDING } });

        if (pendingOrdersCount > 0) {
            notifications.push({
                id: 'orders-pending',
                title: 'New Orders',
                message: `${pendingOrdersCount} orders are pending processing.`,
                type: 'success',
                time: 'Live',
                link: 'orders'
            });
        }

        // 3. Pending Quotes
        const pendingQuotesCount = await AppDataSource.getRepository(Quote)
            .count({ where: { status: QuoteStatus.DRAFT } });

        if (pendingQuotesCount > 0) {
            notifications.push({
                id: 'quotes-pending',
                title: 'Quote Requests',
                message: `${pendingQuotesCount} new quote requests received.`,
                type: 'info',
                time: 'Live',
                link: 'quotes'
            });
        }

        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

export default router;
