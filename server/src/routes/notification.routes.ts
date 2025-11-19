
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { ProductStock } from '../entities/ProductStock';
import { Order, OrderStatus } from '../entities/Order';
import { Quote, QuoteStatus, QuoteType } from '../entities/Quote';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const notifications = [];

        // 1. Special Sourcing Requests (High Priority)
        const sourcingRequests = await AppDataSource.getRepository(Quote)
            .count({ where: { status: QuoteStatus.DRAFT, requestType: QuoteType.SOURCING } });

        if (sourcingRequests > 0) {
            notifications.push({
                id: 'sourcing-pending',
                title: 'Special Import Requests',
                message: `${sourcingRequests} customers are waiting for part sourcing (VIN provided).`,
                type: 'warning', // Orange/Red to grab attention
                time: 'Action Required',
                link: 'quotes'
            });
        }

        // 2. Low Stock Alerts
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
                type: 'info',
                time: 'Live',
                link: 'inventory'
            });
        });

        // 3. Pending Orders
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

        // 4. Standard Quotes
        const pendingQuotesCount = await AppDataSource.getRepository(Quote)
            .count({ where: { status: QuoteStatus.DRAFT, requestType: QuoteType.STANDARD } });

        if (pendingQuotesCount > 0) {
            notifications.push({
                id: 'quotes-pending',
                title: 'General Quotes',
                message: `${pendingQuotesCount} standard price inquiries received.`,
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
