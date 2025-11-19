
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Customer } from '../entities/Customer';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const customerRepo = AppDataSource.getRepository(Customer);

const customerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().min(10),
    address: z.string().optional(),
    kraPin: z.string().optional(),
    isWholesale: z.boolean().optional()
});

// GET /api/customers
router.get('/', authenticate, async (req, res) => {
    try {
        const search = req.query.search as string;
        const query = customerRepo.createQueryBuilder('customer');

        if (search) {
            query.where('customer.name LIKE :search OR customer.phone LIKE :search', { search: `%${search}%` });
        }
        
        const customers = await query.take(50).getMany();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching customers' });
    }
});

// POST /api/customers
router.post('/', authenticate, validate(customerSchema), async (req, res) => {
    try {
        const customer = customerRepo.create(req.body);
        await customerRepo.save(customer);
        res.status(201).json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

export default router;
