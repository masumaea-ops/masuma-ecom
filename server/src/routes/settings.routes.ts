import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { SystemSetting } from '../entities/SystemSetting';
import { authenticate, authorize } from '../middleware/auth';
import { AuditService } from '../services/auditService';
import { Security } from '../utils/security';
import { z } from 'zod';

const router = Router();
const repo = AppDataSource.getRepository(SystemSetting);

// GET /api/settings
// Publicly accessible, but filters sensitive keys for non-admins to prevent 401 errors on frontend
router.get('/', async (req, res) => {
    try {
        const settings = await repo.find();
        const map: Record<string, string> = {};
        
        // Check for Admin Token manually to determine visibility
        const authHeader = req.headers['authorization'];
        let isAdmin = false;
        
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            const payload = Security.verifyToken(token);
            if (payload && (payload.role === 'ADMIN' || payload.role === 'MANAGER')) {
                isAdmin = true;
            }
        }

        // Define prefixes that are safe for public consumption
        const publicPrefixes = ['CMS_', 'BRANCH_', 'COMPANY_', 'SUPPORT_'];

        settings.forEach(s => {
            // Return key if Admin OR if it matches public prefixes
            if (isAdmin || publicPrefixes.some(p => s.key.startsWith(p))) {
                map[s.key] = s.value;
            }
        });

        res.json(map);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// POST /api/settings (Protected: Admin Only)
router.post('/', authenticate, authorize(['ADMIN']), async (req, res) => {
    try {
        const settings = req.body as Record<string, string>;
        const promises = Object.entries(settings).map(async ([key, value]) => {
            let s = await repo.findOneBy({ key });
            if (!s) {
                s = new SystemSetting();
                s.key = key;
            }
            s.value = String(value);
            return repo.save(s);
        });

        await Promise.all(promises);

        await AuditService.log('UPDATE_SETTINGS', 'SYSTEM', 'Updated system configuration', req.user, req.ip);

        res.json({ message: 'Settings saved' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

export default router;