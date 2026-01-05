import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Security } from '../utils/security';
import { authenticate } from '../middleware/auth';
import { EmailService } from '../services/emailService';
import crypto from 'crypto';
import { MoreThan } from 'typeorm';

const router = Router();
const userRepo = AppDataSource.getRepository(User);

router.post('/login', validate(z.object({ email: z.string().email(), password: z.string().min(6) })), async (req, res) => {
    const { email, password } = req.body;
    const user = await userRepo.findOne({ where: { email }, relations: ['branch'] });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const isValid = await Security.comparePassword(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ error: 'Account is disabled' });
    const token = Security.generateToken({ id: user.id, email: user.email, role: user.role, branchId: user.branch?.id });
    res.json({ token, user: { id: user.id, name: user.fullName, role: user.role, email: user.email, branch: user.branch ? { id: user.branch.id, name: user.branch.name } : null } });
});

router.post('/forgot-password', validate(z.object({ email: z.string().email() })), async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userRepo.findOne({ where: { email } });
        
        // Security best practice: don't reveal if user exists, but here we proceed only if they do
        if (user) {
            const token = crypto.randomBytes(32).toString('hex');
            user.resetPasswordToken = token;
            user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
            await userRepo.save(user);

            await EmailService.sendEmail('PASSWORD_RESET', {
                email: user.email,
                token,
                origin: req.headers.origin || 'https://masuma.africa'
            });
        }

        res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process request' });
    }
});

router.post('/reset-password', validate(z.object({ token: z.string(), password: z.string().min(6) })), async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await userRepo.findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: MoreThan(new Date())
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
        }

        user.passwordHash = await Security.hashPassword(password);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await userRepo.save(user);

        res.json({ message: 'Password has been updated successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

router.get('/me', authenticate, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const freshUser = await userRepo.findOne({ where: { id: req.user.id }, relations: ['branch'] });
    res.json(freshUser); 
});

router.put('/profile', authenticate, validate(z.object({ firstName: z.string().optional(), lastName: z.string().optional(), currentPassword: z.string().min(6).optional(), newPassword: z.string().min(6).optional() })), async (req, res) => {
    const { firstName, lastName, currentPassword, newPassword } = req.body;
    const user = await userRepo.findOneBy({ id: req.user!.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (firstName || lastName) user.fullName = `${firstName || ''} ${lastName || ''}`.trim() || user.fullName;
    if (newPassword) {
        if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
        const isMatch = await Security.comparePassword(currentPassword, user.passwordHash);
        if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });
        user.passwordHash = await Security.hashPassword(newPassword);
    }
    await userRepo.save(user);
    res.json({ message: 'Profile updated' });
});

export default router;