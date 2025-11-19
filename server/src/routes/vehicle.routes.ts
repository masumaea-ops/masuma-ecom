
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { SystemSetting } from '../entities/SystemSetting';

const router = Router();
const settingsRepo = AppDataSource.getRepository(SystemSetting);

// GET /api/vehicles/decode/:vin
router.get('/decode/:vin', async (req, res) => {
    const { vin } = req.params;
    
    if (!vin || vin.length < 5) {
        return res.status(400).json({ error: 'Invalid VIN' });
    }

    try {
        const apiKeySetting = await settingsRepo.findOneBy({ key: 'VIN_API_KEY' });
        const apiKey = apiKeySetting?.value;

        // In production: if (apiKey) ... call external API like NHTSA or AutoLoop using this key
        
        // Mock Logic preserved for demo
        const v = vin.toUpperCase();
        let car = null;

        if (v.startsWith('JTN')) car = 'Toyota Land Cruiser Prado';
        else if (v.startsWith('JT1')) car = 'Toyota Corolla';
        else if (v.startsWith('MRH')) car = 'Honda Fit';
        else if (v.startsWith('JMZ')) car = 'Mazda Demio';
        else if (v.startsWith('JF1')) car = 'Subaru Forester';
        else if (v.startsWith('VN1')) car = 'Nissan Note';
        
        if (car) {
            res.json({ make: car.split(' ')[0], model: car });
        } else {
            // If API key exists, we would return 404 from upstream
            // For now, generic error
            res.status(404).json({ error: 'Vehicle not found in database' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Decoding service unavailable' });
    }
});

export default router;
