import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { CrspData } from '../entities/CrspData';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Depreciation rates for Kenya (KRA)
const DEPRECIATION_RATES: Record<number, number> = {
  0: 0.05, // Less than 1 year
  1: 0.10,
  2: 0.15,
  3: 0.20,
  4: 0.30,
  5: 0.40,
  6: 0.50,
  7: 0.60,
  8: 0.70
};

const calculateSchema = z.object({
  crspId: z.string().uuid().optional(),
  customCrsp: z.number().optional(),
  yearOfManufacture: z.number().int(),
  engineSize: z.number(),
  fuelType: z.string(),
  cifValue: z.number().optional() // Cost, Insurance, Freight in USD
});

router.post('/calculate', async (req, res) => {
  try {
    const data = calculateSchema.parse(req.body);
    let crspValue = 0;

    if (data.crspId) {
      const crspRepo = AppDataSource.getRepository(CrspData);
      const crsp = await crspRepo.findOneBy({ id: data.crspId });
      if (crsp) crspValue = Number(crsp.crspValue);
    } else if (data.customCrsp) {
      crspValue = data.customCrsp;
    }

    if (crspValue === 0 && !data.cifValue) {
      return res.status(400).json({ error: 'CRSP or CIF value required for calculation' });
    }

    const currentYear = new Date().getFullYear();
    const age = currentYear - data.yearOfManufacture;
    
    if (age > 8) {
      return res.status(400).json({ error: 'Vehicles older than 8 years cannot be imported to Kenya' });
    }

    // Calculate Depreciation
    const depreciationRate = DEPRECIATION_RATES[age] || 0.70;
    const depreciatedValue = crspValue * (1 - depreciationRate);
    
    // Customs Value (CIF) - Usually the higher of depreciated CRSP or actual CIF
    // For simplicity, we'll use depreciated CRSP if provided, otherwise CIF
    const cif = data.cifValue || depreciatedValue;

    // Tax Rates (Standard Kenya Rates)
    const importDutyRate = 0.25;
    let exciseDutyRate = 0.20; // Default

    // Excise duty varies by engine size and type
    if (data.fuelType.toLowerCase() === 'diesel') {
      if (data.engineSize > 2500) exciseDutyRate = 0.35;
      else if (data.engineSize > 1500) exciseDutyRate = 0.25;
    } else { // Petrol
      if (data.engineSize > 3000) exciseDutyRate = 0.35;
      else if (data.engineSize > 1500) exciseDutyRate = 0.25;
    }

    const vatRate = 0.16;
    const idfRate = 0.035;
    const rdlRate = 0.02;

    // Calculations
    const importDuty = cif * importDutyRate;
    const exciseValue = cif + importDuty;
    const exciseDuty = exciseValue * exciseDutyRate;
    const vatValue = exciseValue + exciseDuty;
    const vat = vatValue * vatRate;
    const idf = cif * idfRate;
    const rdl = cif * rdlRate;

    const totalTaxes = importDuty + exciseDuty + vat + idf + rdl;

    res.json({
      cif,
      importDuty,
      exciseDuty,
      vat,
      idf,
      rdl,
      totalTaxes,
      totalCost: cif + totalTaxes,
      breakdown: {
        age,
        depreciationRate,
        importDutyRate,
        exciseDutyRate,
        vatRate
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get CRSP data for selection
router.get('/crsp', async (req, res) => {
  try {
    const { make, model, year } = req.query;
    const crspRepo = AppDataSource.getRepository(CrspData);
    
    const query = crspRepo.createQueryBuilder('crsp');

    if (make) query.andWhere('crsp.make = :make', { make });
    if (model) query.andWhere('crsp.model = :model', { model });
    if (year) query.andWhere('crsp.year = :year', { year: Number(year) });

    const results = await query.getMany();
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk upload CRSP data (Admin only)
router.post('/upload-crsp', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const data = req.body; // Expecting an array of CRSP objects
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Data must be an array' });
    }

    const crspRepo = AppDataSource.getRepository(CrspData);
    
    // For simplicity, we'll clear and reload or just insert
    // In production, we'd do a upsert or batch insert
    const entities = crspRepo.create(data);
    await crspRepo.save(entities);

    res.json({ message: `Successfully uploaded ${entities.length} CRSP records` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
