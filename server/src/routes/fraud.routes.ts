import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { FraudReport, FraudReportStatus } from '../entities/FraudReport';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();
const fraudRepo = AppDataSource.getRepository(FraudReport);

// POST /api/fraud/report
router.post('/report', authenticateToken, async (req: any, res) => {
  try {
    const { listingId, reason, description } = req.body;
    const reporterId = req.user.id;

    if (!reason || !description) {
      return res.status(400).json({ error: 'Reason and description are required' });
    }

    const report = fraudRepo.create({
      listingId,
      reporterId,
      reason,
      description,
      status: FraudReportStatus.PENDING
    });

    await fraudRepo.save(report);
    res.status(201).json(report);
  } catch (error) {
    console.error('Error reporting fraud:', error);
    res.status(500).json({ error: 'Failed to submit fraud report' });
  }
});

// GET /api/fraud/reports (Admin only)
router.get('/reports', authenticateToken, isAdmin, async (req, res) => {
  try {
    const reports = await fraudRepo.find({
      relations: ['reporter', 'listing'],
      order: { createdAt: 'DESC' }
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fraud reports' });
  }
});

// PATCH /api/fraud/reports/:id (Admin only)
router.patch('/reports/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const report = await fraudRepo.findOneBy({ id });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (status) report.status = status;
    if (adminNotes) report.adminNotes = adminNotes;

    await fraudRepo.save(report);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update fraud report' });
  }
});

export default router;
