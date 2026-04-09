import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { ImportRequest, ImportRequestStatus } from '../entities/ImportRequest';
import { authenticate, isAdmin } from '../middleware/auth';

const router = Router();
const importRepo = AppDataSource.getRepository(ImportRequest);

// POST /api/import-requests
router.post('/', authenticate, async (req: any, res) => {
  try {
    const { make, model, minYear, budgetKes, sourceCountry, additionalNotes } = req.body;
    const userId = req.user.id;

    if (!make || !model || !minYear || !budgetKes) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const request = importRepo.create({
      userId,
      make,
      model,
      minYear,
      budgetKes,
      sourceCountry: sourceCountry || 'Japan',
      additionalNotes,
      status: ImportRequestStatus.PENDING
    });

    await importRepo.save(request);
    res.status(201).json(request);
  } catch (error) {
    console.error('Error creating import request:', error);
    res.status(500).json({ error: 'Failed to submit import request' });
  }
});

// GET /api/import-requests/my
router.get('/my', authenticate, async (req: any, res) => {
  try {
    const requests = await importRepo.find({
      where: { userId: req.user.id },
      order: { createdAt: 'DESC' }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your import requests' });
  }
});

// GET /api/import-requests (Admin only)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const requests = await importRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch import requests' });
  }
});

// PATCH /api/import-requests/:id (Admin only)
router.patch('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    const requestObj = await importRepo.findOneBy({ id: id as any });
    if (!requestObj) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (status) requestObj.status = status;
    if (adminResponse) requestObj.adminResponse = adminResponse;

    await importRepo.save(requestObj);
    res.json(requestObj);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update import request' });
  }
});

export default router;
