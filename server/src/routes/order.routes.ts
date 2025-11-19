
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Order, OrderStatus } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const orderRepo = AppDataSource.getRepository(Order);

// POST /api/orders
// Public endpoint for Website Checkout (Manual / Pay on Delivery)
const createOrderSchema = z.object({
    customerName: z.string().min(2),
    customerEmail: z.string().email(),
    customerPhone: z.string().min(10),
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1),
        price: z.number()
    })),
    paymentMethod: z.string().default('MANUAL')
});

router.post('/', validate(createOrderSchema), async (req, res) => {
    try {
        const { customerName, customerEmail, customerPhone, items, paymentMethod } = req.body;
        
        const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

        const order = new Order();
        order.customerName = customerName;
        order.customerEmail = customerEmail;
        order.customerPhone = customerPhone;
        order.totalAmount = totalAmount;
        order.status = OrderStatus.PENDING; // Manual orders are pending until verified
        
        order.items = items.map((i: any) => {
            const item = new OrderItem();
            item.product = { id: i.productId } as any;
            item.quantity = i.quantity;
            item.price = i.price;
            return item;
        });

        await orderRepo.save(order);

        // In a real app, trigger email notification here
        
        res.status(201).json({ 
            message: 'Order created successfully', 
            orderId: order.id,
            orderNumber: `ORD-${Date.now().toString().slice(-6)}` // Simple order ID generation
        });
    } catch (error) {
        console.error('Order Creation Error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// GET /api/orders
// Filterable list for Order Manager
router.get('/', authenticate, async (req, res) => {
    try {
        const status = req.query.status as string;
        const search = req.query.search as string;
        
        const query = orderRepo.createQueryBuilder('order')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndSelect('items.product', 'product')
            .orderBy('order.createdAt', 'DESC');

        if (status && status !== 'All Statuses') {
            query.andWhere('order.status = :status', { status });
        }

        if (search) {
            query.andWhere('(order.id LIKE :search OR order.customerName LIKE :search)', { search: `%${search}%` });
        }

        const orders = await query.take(50).getMany();
        
        // Transform for frontend dashboard
        const formattedOrders = orders.map(o => ({
            id: o.id,
            orderNumber: o.id.substring(0, 8).toUpperCase(), // Mock order number from UUID
            customerName: o.customerName,
            date: new Date(o.createdAt).toLocaleDateString(),
            total: Number(o.totalAmount),
            status: o.status,
            paymentMethod: 'Manual', // Default for now
            items: o.items.map(i => ({ name: i.product?.name || 'Product', qty: i.quantity }))
        }));

        res.json(formattedOrders);
    } catch (error) {
        console.error(error);
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
