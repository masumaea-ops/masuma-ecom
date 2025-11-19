
import { Router } from 'express';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import { Queue } from 'bullmq';
import { redis } from '../config/redis';

const router = Router();
const emailQueue = new Queue('email-queue', { connection: redis });

const contactSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10).optional(),
    subject: z.string().min(3),
    message: z.string().min(10)
});

// POST /api/contact
router.post('/', validate(contactSchema), async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Enqueue email job
        await emailQueue.add('send-email', {
            type: 'QUOTE_REQUEST', // Reuse type or make new one for general contact
            data: { 
                name, 
                email, 
                phone: phone || 'N/A', 
                message: `Subject: ${subject}\n\n${message}`, 
                productName: 'General Inquiry' // Adapting to existing worker structure
            }
        });

        res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact API Error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

export default router;
