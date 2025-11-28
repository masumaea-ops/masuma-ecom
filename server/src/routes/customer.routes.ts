
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
        
        // Use QueryBuilder to calculate Total Spend and Last Visit dynamically
        const query = customerRepo.createQueryBuilder('customer')
            .leftJoin('customer.sales', 'sale')
            .select('customer.id', 'id')
            .addSelect('customer.name', 'name')
            .addSelect('customer.email', 'email')
            .addSelect('customer.phone', 'phone')
            .addSelect('customer.kraPin', 'kraPin')
            .addSelect('customer.address', 'address')
            .addSelect('customer.isWholesale', 'isWholesale')
            .addSelect('customer.createdAt', 'createdAt')
            .addSelect('COALESCE(SUM(sale.totalAmount), 0)', 'totalSpend')
            .addSelect('MAX(sale.createdAt)', 'lastVisit')
            .groupBy('customer.id');

        if (search) {
            query.where('customer.name LIKE :search OR customer.phone LIKE :search', { search: `%${search}%` });
        }
        
        const results = await query.getRawMany();
        
        // Map raw results to clean JSON objects
        const customers = results.map(r => ({
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone,
            kraPin: r.kraPin,
            address: r.address,
            isWholesale: !!r.isWholesale, // Convert 1/0 to boolean
            createdAt: r.createdAt,
            totalSpend: Number(r.totalSpend),
            lastVisit: r.lastVisit ? new Date(r.lastVisit).toLocaleDateString() : 'Never'
        }));

        res.json(customers);
    } catch (error) {
        console.error('Fetch Customers Error:', error);
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
