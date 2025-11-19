
import { Router } from 'express';
import { InventoryService } from '../services/inventoryService';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// GET /api/inventory
// Returns stock for a specific branch
router.get('/', authenticate, async (req, res) => {
    try {
        const branchId = req.query.branchId as string || req.user?.branch?.id;
        if (!branchId) return res.status(400).json({ error: 'Branch ID required' });

        const lowStock = req.query.lowStock === 'true';
        const stock = await InventoryService.getStockForBranch(branchId, lowStock);
        res.json(stock);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// PATCH /api/inventory/:productId
// Adjust stock manually
const updateStockSchema = z.object({
    branchId: z.string(),
    quantity: z.number().min(0),
    operation: z.enum(['set', 'add', 'subtract'])
});

router.patch('/:productId', authenticate, authorize(['ADMIN', 'MANAGER']), validate(updateStockSchema), async (req, res) => {
    try {
        const { branchId, quantity, operation } = req.body;
        const updated = await InventoryService.updateStock(req.params.productId, branchId, quantity, operation);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

// POST /api/inventory/transfer
const transferStockSchema = z.object({
    productId: z.string(),
    fromBranchId: z.string(),
    toBranchId: z.string(),
    quantity: z.number().min(1)
});

router.post('/transfer', authenticate, authorize(['ADMIN', 'MANAGER']), validate(transferStockSchema), async (req, res) => {
    try {
        const { productId, fromBranchId, toBranchId, quantity } = req.body;
        
        if (fromBranchId === toBranchId) {
            return res.status(400).json({ error: 'Cannot transfer to the same branch' });
        }

        await InventoryService.transferStock(productId, fromBranchId, toBranchId, quantity, req.user!.id);
        res.json({ message: 'Transfer successful' });
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Transfer failed' });
    }
});

export default router;
