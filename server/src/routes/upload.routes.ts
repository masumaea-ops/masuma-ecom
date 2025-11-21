import { Router, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../config/multer';

const router = Router();

// POST /api/upload
router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), upload.single('image'), (req: any, res: any) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Construct URL (Assuming server is at root relative to client or configured base URL)
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    res.json({ 
        url: fileUrl,
        filename: req.file.filename 
    });
});

export default router;