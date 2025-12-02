import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Order, OrderStatus } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';
import { SaleService } from '../services/saleService';

const router = Router();
const orderRepo = AppDataSource.getRepository(Order);

// POST /api/orders
// Public endpoint for Website Checkout (Manual / Pay on Delivery)
const createOrderSchema = z.object({
    customerName: z.string(),
    // Completely relaxed email validation to allow empty, null, undefined, or valid email
    customerEmail: z.union([z.string().email(), z.string(), z.null(), z.undefined()]).optional(),
    customerPhone: z.string(),
    shippingAddress: z.string().optional(),
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.coerce.number(),
        price: z.coerce.number()
    })),
    paymentMethod: z.string().optional()
});

router.post('/', validate(createOrderSchema), async (req, res) => {
    try {
        const { customerName, customerEmail, customerPhone, shippingAddress, items, paymentMethod } = req.body;
        
        const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

        const order = new Order();
        order.orderNumber = `ORD-${Date.now().toString().slice(-6)}`; // Fallback ID
        order.customerName = customerName;
        // Handle empty string email as undefined
        order.customerEmail = (customerEmail && customerEmail.length > 0) ? customerEmail : undefined;
        order.customerPhone = customerPhone;
        order.shippingAddress = shippingAddress || '';
        order.totalAmount = totalAmount;
        
        // FIX: Explicitly initialize payment fields
        order.amountPaid = 0;
        order.balance = totalAmount;

        order.status = OrderStatus.PENDING;
        order.paymentMethod = paymentMethod || 'MANUAL';
        
        order.items = items.map((i: any) => {
            const item = new OrderItem();
            item.product = { id: i.productId } as any;
            item.quantity = i.quantity;
            item.price = i.price;
            return item;
        });

        await orderRepo.save(order);

        // Try to trigger email, but don't fail if it fails
        try {
             // Email notification logic here if needed
        } catch (e) {
            console.error("Email notification failed", e);
        }
        
        res.status(201).json({ 
            message: 'Order created successfully', 
            orderId: order.id,
            orderNumber: order.orderNumber
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
            .leftJoinAndSelect('product.oemNumbers', 'oem') // Include OEMs
            .orderBy('order.createdAt', 'DESC');

        if (status && status !== 'All Statuses' && status !== 'All') {
            query.andWhere('order.status = :status', { status });
        }

        if (search) {
            query.andWhere('(order.id LIKE :search OR order.customerName LIKE :search)', { search: `%${search}%` });
        }

        const orders = await query.take(50).getMany();
        
        // Transform for frontend dashboard with FULL DETAILS
        const formattedOrders = orders.map(o => ({
            id: o.id,
            orderNumber: o.orderNumber || o.id.substring(0, 8).toUpperCase(),
            customerName: o.customerName,
            customerEmail: o.customerEmail,
            customerPhone: o.customerPhone,
            shippingAddress: o.shippingAddress,
            date: new Date(o.createdAt).toLocaleDateString(),
            total: Number(o.totalAmount),
            status: o.status,
            paymentMethod: o.paymentMethod || 'Manual',
            items: o.items.map(i => ({ 
                id: i.id,
                name: i.product?.name || 'Unknown Product', 
                sku: i.product?.sku || 'N/A',
                oem: i.product?.oemNumbers?.[0]?.code || '', // Extract first OEM
                qty: i.quantity,
                price: Number(i.price),
                image: i.product?.imageUrl
            }))
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
    status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'FAILED']),
    trackingInfo: z.string().optional()
});

router.patch('/:id/status', authenticate, authorize(['ADMIN', 'MANAGER']), validate(updateStatusSchema), async (req, res) => {
    try {
        const { status } = req.body;
        
        // Load order with items and products to allow sale creation
        const order = await orderRepo.findOne({ 
            where: { id: req.params.id },
            relations: ['items', 'items.product'] 
        });
        
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const previousStatus = order.status;
        order.status = status as OrderStatus;
        await orderRepo.save(order);
        
        // CRITICAL: If marking as PAID for the first time, convert to Sale
        // This updates dashboard stats and deducts inventory
        if (status === 'PAID' && previousStatus !== 'PAID') {
            try {
                await SaleService.createSaleFromOrder(order, req.user);
            } catch (saleError) {
                console.error("Failed to create sale record from order:", saleError);
                // Don't fail the request, but log it
            }
        }

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