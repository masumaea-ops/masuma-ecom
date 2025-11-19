
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuditService } from '../services/auditService';
import { Security } from '../utils/security';
import { z } from 'zod';

const router = Router();
const userRepo = AppDataSource.getRepository(User);

const createUserSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'B2B_USER']),
    branchId: z.string().optional()
});

// GET /api/users
router.get('/', authenticate, authorize(['ADMIN']), async (req, res) => {
    try {
        const users = await userRepo.find({
            relations: ['branch'],
            select: {
                id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true,
                branch: { id: true, name: true }
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /api/users
router.post('/', authenticate, authorize(['ADMIN']), validate(createUserSchema), async (req, res) => {
    try {
        const { fullName, email, password, role, branchId } = req.body;
        
        const existing = await userRepo.findOneBy({ email });
        if (existing) return res.status(400).json({ error: 'Email already exists' });

        const user = new User();
        user.fullName = fullName;
        user.email = email;
        user.passwordHash = await Security.hashPassword(password);
        user.role = role;
        if (branchId) user.branch = { id: branchId } as any;

        await userRepo.save(user);

        // Log action
        await AuditService.log(
            'CREATE_USER', 
            user.id, 
            `Created user ${email} with role ${role}`, 
            req.user, 
            req.ip
        );

        res.status(201).json({ message: 'User created', id: user.id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// DELETE /api/users/:id
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
    try {
        const user = await userRepo.findOneBy({ id: req.params.id });
        if (!user) return res.status(404).json({ error: 'User not found' });

        await userRepo.remove(user);
        
        await AuditService.log(
            'DELETE_USER', 
            req.params.id, 
            `Deleted user ${user.email}`, 
            req.user, 
            req.ip
        );

        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

export default router;
