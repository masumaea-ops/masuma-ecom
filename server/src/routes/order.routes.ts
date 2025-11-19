
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Order, OrderStatus } from '../entities/Order';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const orderRepo = AppDataSource.getRepository(Order);

// GET /api/orders
// Filterable list for Order Manager
router.get('/', authenticate, async (req, res) => {
    try {
        const status = req.query.status as string;
        const search = req.query.search as string;
        
        const query = orderRepo.createQueryBuilder('order')
            .leftJoinAndSelect('order.items', 'items')
            .orderBy('order.createdAt', 'DESC');

        if (status && status !== 'All Statuses') {
            query.andWhere('order.status = :status', { status });
        }

        if (search) {
            query.andWhere('(order.id LIKE :search OR order.customerName LIKE :search)', { search: `%${search}%` });
        }

        const orders = await query.take(50).getMany();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// PATCH /api/orders/:id/status
// Update status (e.g. for Shipping Manager)
const updateStatusSchema = z.object({
    status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED']),
    trackingInfo: z.string().optional()
});

router.patch('/:id/status', authenticate, authorize(['ADMIN', 'MANAGER']), validate(updateStatusSchema), async (req, res) => {
    try {
        const { status } = req.body;
        const order = await orderRepo.findOneBy({ id: req.params.id });
        
        if (!order) return res.status(404).json({ error: 'Order not found' });

        order.status = status as OrderStatus;
        await orderRepo.save(order);
        
        // Trigger notification logic here (email/SMS) if needed

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// POST /api/orders/bulk
// For B2B CSV Uploads (Placeholder logic)
router.post('/bulk', authenticate, async (req, res) => {
    // Logic to parse CSV and create multiple orders would go here
    res.status(501).json({ message: 'Bulk upload not yet implemented' });
});

export default router;
