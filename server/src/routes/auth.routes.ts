
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

const router = Router();
const userRepo = AppDataSource.getRepository(User);

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;
    
    // In production: Compare password hash using bcrypt
    const user = await userRepo.findOne({ where: { email }, relations: ['branch'] });

    if (!user || user.passwordHash !== password) { // Simplification for demo
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // In production: Generate JWT
    const token = user.id; // Mock token

    res.json({
        token,
        user: {
            id: user.id,
            name: user.fullName,
            role: user.role,
            branch: user.branch ? { id: user.branch.id, name: user.branch.name } : null
        }
    });
});

// GET /api/auth/me
// Protected route example is handled in middleware, but here's a stub
router.get('/me', async (req, res) => {
    // @ts-ignore - user injected by middleware
    res.json(req.user || { error: 'Not authenticated' }); 
});

export default router;
