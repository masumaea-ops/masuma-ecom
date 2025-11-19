
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { MpesaTransaction } from '../entities/MpesaTransaction';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const mpesaRepo = AppDataSource.getRepository(MpesaTransaction);

// GET /api/mpesa/logs
// Fetch recent M-Pesa transactions for debugging
router.get('/logs', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const logs = await mpesaRepo.find({
            order: { createdAt: 'DESC' },
            take: 100,
            relations: ['order']
        });

        const formattedLogs = logs.map(log => ({
            id: log.id,
            checkoutRequestID: log.checkoutRequestID,
            phoneNumber: log.phoneNumber,
            amount: Number(log.amount),
            status: log.status,
            mpesaReceiptNumber: log.mpesaReceiptNumber,
            resultDesc: log.resultDesc,
            date: log.createdAt.toLocaleString()
        }));

        res.json(formattedLogs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch M-Pesa logs' });
    }
});

export default router;
