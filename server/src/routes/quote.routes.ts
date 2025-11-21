
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Quote, QuoteStatus, QuoteType } from '../entities/Quote';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import { EmailService } from '../services/emailService';

const router = Router();
const quoteRepo = AppDataSource.getRepository(Quote);

// Schema
const createQuoteSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
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

        const quote = new Quote();
        quote.quoteNumber = `QT-${Date.now().toString().slice(-6)}`;
        quote.requestType = requestType as QuoteType;
        quote.vin = vin;

        let quoteItems = items || [];

        if (requestType === 'SOURCING') {
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
        quote.subtotal = 0;
        quote.tax = 0;
        quote.total = 0;
        quote.status = QuoteStatus.DRAFT;
        
        await quoteRepo.save(quote);

        const emailBody = requestType === 'SOURCING'
            ? `Customer: ${name}\nVIN: ${vin}\nPart: ${partNumber || 'N/A'}\nDesc: ${description}`
            : `Customer: ${name}\nProduct: ${productName}\nMessage: ${message}`;

        await EmailService.sendEmail('QUOTE_REQUEST', {
            name, email, phone,
            message: emailBody,
            productName: requestType === 'SOURCING' ? 'Special Sourcing' : quoteItems[0]?.name 
        });

        res.status(201).json({ message: 'Request received', quoteId: quote.id });
    } catch (error) {
        console.error(error);
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

export default router;
