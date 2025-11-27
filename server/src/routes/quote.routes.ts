import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Quote, QuoteStatus, QuoteType } from '../entities/Quote';
import { Customer } from '../entities/Customer';
import { Order, OrderStatus } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import { EmailService } from '../services/emailService';

const router = Router();
const quoteRepo = AppDataSource.getRepository(Quote);
const customerRepo = AppDataSource.getRepository(Customer);
const orderRepo = AppDataSource.getRepository(Order);

// Schema
const createQuoteSchema = z.object({
    name: z.string().min(2),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().min(10),
    message: z.string().optional(),
    
    productId: z.string().optional(),
    productName: z.string().optional(),
    
    vin: z.string().min(5).optional(),
    partNumber: z.string().optional(),
    description: z.string().optional(),
    requestType: z.enum(['STANDARD', 'SOURCING']).default('STANDARD'),

    items: z.array(z.object({
        productId: z.string().optional(),
        name: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        total: z.number()
    })).optional()
});

router.get('/', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const quotes = await quoteRepo.find({
            order: { createdAt: 'DESC' },
            take: 100,
            relations: ['customer']
        });
        
        const formatted = quotes.map(q => ({
            id: q.id,
            quoteNumber: q.quoteNumber,
            customerName: q.customer?.name || 'Guest',
            customerEmail: q.customer?.email || 'N/A',
            customerPhone: q.customer?.phone || 'N/A',
            date: q.createdAt.toLocaleDateString(),
            total: Number(q.total),
            status: q.status,
            type: q.requestType,
            vin: q.vin,
            itemsCount: q.items?.length || 0,
            items: q.items 
        }));

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch quotes' });
    }
});

router.post('/', validate(createQuoteSchema), async (req, res) => {
    try {
        const { name, email, phone, message, productId, productName, items, vin, partNumber, description, requestType } = req.body;

        // 1. Find or Create Customer
        let customer = await customerRepo.findOne({
            where: [
                { email: email },
                { phone: phone }
            ]
        });

        if (!customer) {
            customer = new Customer();
            customer.name = name;
            customer.email = email || undefined;
            customer.phone = phone;
            customer.isWholesale = false;
            await customerRepo.save(customer);
        }

        // 2. Create Quote
        const quote = new Quote();
        quote.quoteNumber = `QT-${Date.now().toString().slice(-6)}`;
        quote.requestType = requestType as QuoteType;
        quote.vin = vin;
        quote.customer = customer; 

        let quoteItems = items || [];

        if (requestType === 'SOURCING' && quoteItems.length === 0) {
            const itemName = description || 'Special Order Part';
            const details = partNumber ? `${itemName} (PN: ${partNumber})` : itemName;
            
            quoteItems = [{
                name: details,
                quantity: 1,
                unitPrice: 0, 
                total: 0
            }];
        } 
        else if (!items && productId && productName) {
            quoteItems = [{
                productId,
                name: productName,
                quantity: 1,
                unitPrice: 0, 
                total: 0
            }];
        }

        quote.items = quoteItems;
        quote.subtotal = quoteItems.reduce((acc: number, i: any) => acc + (Number(i.total) || 0), 0);
        quote.tax = quote.subtotal * 0.16; // Approx
        quote.total = quote.subtotal; // Usually inclusive in basic logic
        quote.status = QuoteStatus.DRAFT;
        
        await quoteRepo.save(quote);

        // 3. Send Notifications (Non-blocking)
        // Only send if it was a public request, not an admin creation
        if (!req.user) {
            const emailBody = requestType === 'SOURCING'
                ? `Customer: ${name}\nVIN: ${vin}\nPart: ${partNumber || 'N/A'}\nDesc: ${description}`
                : `Customer: ${name}\nProduct: ${productName}\nMessage: ${message}`;

            EmailService.sendEmail('QUOTE_REQUEST', {
                name, email, phone,
                message: emailBody,
                productName: requestType === 'SOURCING' ? 'Special Sourcing' : quoteItems[0]?.name 
            }).catch(err => console.error("Email dispatch error:", err));
        }

        res.status(201).json({ message: 'Quote created', quoteId: quote.id });
    } catch (error) {
        console.error("Quote Error:", error);
        res.status(500).json({ error: 'Failed to submit quote' });
    }
});

const updateQuoteSchema = z.object({
    status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED']).optional(),
    items: z.array(z.any()).optional(),
    total: z.number().optional()
});

router.patch('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), validate(updateQuoteSchema), async (req, res) => {
    try {
        const quote = await quoteRepo.findOneBy({ id: req.params.id });
        if (!quote) return res.status(404).json({ error: 'Quote not found' });

        if (req.body.status) quote.status = req.body.status;
        if (req.body.items) quote.items = req.body.items;
        if (req.body.total !== undefined) quote.total = req.body.total;

        await quoteRepo.save(quote);
        res.json(quote);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update quote' });
    }
});

// POST /api/quotes/:id/convert
// Convert a Quote to an Order (Invoice)
router.post('/:id/convert', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const quote = await quoteRepo.findOne({ 
            where: { id: req.params.id },
            relations: ['customer']
        });

        if (!quote) return res.status(404).json({ error: 'Quote not found' });
        if (quote.status === QuoteStatus.CONVERTED) return res.status(400).json({ error: 'Quote already converted' });

        // Create Order
        const order = new Order();
        order.orderNumber = `INV-${Date.now().toString().slice(-6)}`; // INV prefix for Invoices
        order.customerName = quote.customer.name;
        order.customerEmail = quote.customer.email || '';
        order.customerPhone = quote.customer.phone || '';
        order.shippingAddress = quote.customer.address || 'Pickup';
        order.totalAmount = quote.total;
        order.status = OrderStatus.PENDING; // Unpaid Invoice
        order.sourceQuote = quote;

        // Map Items
        order.items = quote.items.map((qi: any) => {
            const item = new OrderItem();
            if (qi.productId) item.product = { id: qi.productId } as any;
            item.quantity = qi.quantity;
            item.price = qi.unitPrice;
            // Fallback description logic if product link missing is handled in frontend view
            return item;
        });

        await orderRepo.save(order);

        // Update Quote
        quote.status = QuoteStatus.CONVERTED;
        quote.convertedOrder = order;
        await quoteRepo.save(quote);

        res.status(201).json({ message: 'Converted to Invoice', orderId: order.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Conversion failed' });
    }
});

export default router;