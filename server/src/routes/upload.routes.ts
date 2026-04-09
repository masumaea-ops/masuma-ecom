
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../config/multer';

const router = Router();

// POST /api/upload
router.post('/', authenticate, upload.single('file'), (req: any, res: any) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded. Check file size/type.' });
    }

    // Construct URL dynamically based on the incoming request
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    
    const fileUrl = `${protocol}://${host}/media/${req.file.filename}`;

    res.json({ 
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname
    });
});

// POST /api/upload/report
router.post('/report', authenticate, upload.single('report'), (req: any, res: any) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded. Check file size/type.' });
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    
    const fileUrl = `${protocol}://${host}/media/${req.file.filename}`;

    res.json({ 
        url: fileUrl,
        filename: req.file.filename
    });
});

export default router;
