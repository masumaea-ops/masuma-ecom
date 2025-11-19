
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { SystemSetting } from '../entities/SystemSetting';
import { authenticate, authorize } from '../middleware/auth';
import { AuditService } from '../services/auditService';
import { z } from 'zod';

const router = Router();
const repo = AppDataSource.getRepository(SystemSetting);

// GET /api/settings
router.get('/', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const settings = await repo.find();
        // Convert array to object map
        const map: Record<string, string> = {};
        settings.forEach(s => map[s.key] = s.value);
        res.json(map);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// POST /api/settings
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
