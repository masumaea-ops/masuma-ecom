
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Security } from '../utils/security';
import { authenticate } from '../middleware/auth';

const router = Router();
const userRepo = AppDataSource.getRepository(User);

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;
    
    const user = await userRepo.findOne({ where: { email }, relations: ['branch'] });

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await Security.comparePassword(password, user.passwordHash);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
        return res.status(403).json({ error: 'Account is disabled' });
    }

    const token = Security.generateToken({ 
        id: user.id, 
        email: user.email, 
        role: user.role,
        branchId: user.branch?.id 
    });

    res.json({
        token,
        user: {
            id: user.id,
            name: user.fullName,
            role: user.role,
            email: user.email,
            branch: user.branch ? { id: user.branch.id, name: user.branch.name } : null
        }
    });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    
    // Return fresh data
    const freshUser = await userRepo.findOne({ 
        where: { id: req.user.id },
        relations: ['branch'],
        select: { id: true, fullName: true, email: true, role: true, branch: { id: true, name: true } }
    });

    res.json(freshUser); 
});

const updateProfileSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    currentPassword: z.string().min(6).optional(),
    newPassword: z.string().min(6).optional()
});

// PUT /api/auth/profile
router.put('/profile', authenticate, validate(updateProfileSchema), async (req, res) => {
    const { firstName, lastName, currentPassword, newPassword } = req.body;
    const user = await userRepo.findOneBy({ id: req.user!.id });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Update Name
    if (firstName || lastName) {
        user.fullName = `${firstName || ''} ${lastName || ''}`.trim() || user.fullName;
    }

    // Update Password
    if (newPassword) {
        if (!currentPassword) {
            return res.status(400).json({ error: 'Current password required to set new password' });
        }
        const isMatch = await Security.comparePassword(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }
        user.passwordHash = await Security.hashPassword(newPassword);
    }

    await userRepo.save(user);
    res.json({ message: 'Profile updated successfully' });
});

export default router;
