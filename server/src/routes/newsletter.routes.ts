import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Subscriber } from '../entities/Subscriber';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';
import { AuditService } from '../services/auditService';
import { logger } from '../utils/logger';

const router = Router();

const subscribeSchema = z.object({
    email: z.string().email("Please provide a valid email address.")
});

// GET /api/newsletter - Admin Only
router.get('/', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        if (!AppDataSource.isInitialized) await AppDataSource.initialize();
        const subscriberRepo = AppDataSource.getRepository(Subscriber);
        const subscribers = await subscriberRepo.find({
            order: { createdAt: 'DESC' }
        });
        res.json(subscribers);
    } catch (error: any) {
        logger.error('Newsletter Fetch Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch subscribers' });
    }
});

// POST /api/newsletter/subscribe - Public
router.post('/subscribe', validate(subscribeSchema), async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const subscriberRepo = AppDataSource.getRepository(Subscriber);
        
        const emailLower = email.toLowerCase().trim();
        const existing = await subscriberRepo.findOneBy({ email: emailLower });
        
        if (existing) {
            return res.status(200).json({ 
                message: 'Jambo! You are already on our VIP list.',
                alreadySubscribed: true 
            });
        }

        const subscriber = subscriberRepo.create({ email: emailLower });
        await subscriberRepo.save(subscriber);

        await AuditService.log('NEWSLETTER_SIGNUP', subscriber.id, `New subscriber joined: ${emailLower}`);

        res.status(201).json({ 
            message: 'Welcome to Masuma! You will now receive exclusive updates.',
            success: true 
        });
    } catch (error: any) {
        logger.error('Newsletter Subscribe Error:', {
            name: error.name,
            message: error.message
        });

        res.status(500).json({ 
            error: 'Subscription failed. Please try again later.',
            details: error.message
        });
    }
});

// DELETE /api/newsletter/:id - Admin Only
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
    try {
        if (!AppDataSource.isInitialized) await AppDataSource.initialize();
        const subscriberRepo = AppDataSource.getRepository(Subscriber);
        await subscriberRepo.delete(req.params.id);
        res.json({ message: 'Subscriber removed.' });
    } catch (error: any) {
        logger.error('Newsletter Delete Error:', error.message);
        res.status(500).json({ error: 'Failed to remove subscriber' });
    }
});

export default router;