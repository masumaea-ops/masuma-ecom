
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Quote, QuoteStatus } from '../entities/Quote';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import { Queue } from 'bullmq';
import { redis } from '../config/redis';

const router = Router();
const quoteRepo = AppDataSource.getRepository(Quote);
const emailQueue = new Queue('email-queue', { connection: redis });

// Schema
const createQuoteSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    message: z.string().optional(),
    productId: z.string().optional(),
    productName: z.string().optional(),
    items: z.array(z.object({
        productId: z.string(),
        name: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        total: z.number()
    })).optional()
});

// GET /api/quotes (Admin)
router.get('/', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const quotes = await quoteRepo.find({
            order: { createdAt: 'DESC' },
            take: 100,
            relations: ['customer']
        });
        
        // Map for frontend
        const formatted = quotes.map(q => ({
            id: q.id,
            quoteNumber: q.quoteNumber,
            customerName: q.customer?.name || 'Guest', // Fallback if customer relation not set
            date: q.createdAt.toLocaleDateString(),
            total: Number(q.total),
            status: q.status,
            itemsCount: q.items?.length || 0
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch quotes' });
    }
});

// POST /api/quotes (Public Request)
router.post('/', validate(createQuoteSchema), async (req, res) => {
    try {
        const { name, email, phone, message, productId, productName, items } = req.body;

        const quote = new Quote();
        quote.quoteNumber = `QT-${Date.now().toString().slice(-6)}`;
        // In a real scenario, we'd find/create a Customer entity here. 
        // For simplicity in this specific flow, we store the contact info in the entity or link a temp customer.
        // We'll assume the frontend passes items, or we construct a single item from product details.
        
        let quoteItems = items || [];
        if (!items && productId && productName) {
            quoteItems = [{
                productId,
                name: productName,
                quantity: 1,
                unitPrice: 0, // TBD by Admin
                total: 0
            }];
        }

        quote.items = quoteItems;
        quote.subtotal = 0;
        quote.tax = 0;
        quote.total = 0;
        quote.status = QuoteStatus.DRAFT;
        
        // Note: To properly link customer, we would need to look them up by email/phone
        // For now, we are saving the quote. Ideally Quote entity has direct fields for guest info if Customer is optional
        // Or we just trigger the email job as before if we don't want to persist incomplete quotes yet.
        
        // HYBRID APPROACH: Save to DB AND Send Email
        await quoteRepo.save(quote);

        await emailQueue.add('send-email', { 
            type: 'QUOTE_REQUEST', 
            data: { name, email, phone, message, productName: quoteItems[0]?.name || 'Multiple Items' } 
        });

        res.status(201).json({ message: 'Quote request received', quoteId: quote.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to submit quote' });
    }
});

// PATCH /api/quotes/:id (Admin Update Status)
const updateQuoteSchema = z.object({
    status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED']),
});

router.patch('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), validate(updateQuoteSchema), async (req, res) => {
    try {
        const quote = await quoteRepo.findOneBy({ id: req.params.id });
        if (!quote) return res.status(404).json({ error: 'Quote not found' });

        quote.status = req.body.status;
        await quoteRepo.save(quote);
        res.json(quote);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update quote' });
    }
});

export default router;
