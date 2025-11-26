
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../config/multer';

const router = Router();

// POST /api/upload
router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), upload.single('image'), (req: any, res: any) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded. Check file size/type.' });
    }

    // Construct URL dynamically based on the incoming request
    // This ensures it works whether on localhost:3000 or a deployed domain
    const protocol = req.protocol;
    const host = req.get('host');
    
    // Note: 'media' directory is served statically at /media
    const fileUrl = `${protocol}://${host}/media/${req.file.filename}`;

    res.json({ 
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname
    });
});

export default router;
