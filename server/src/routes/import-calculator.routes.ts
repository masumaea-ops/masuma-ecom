import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { CrspData } from '../entities/CrspData';
import { SystemSetting } from '../entities/SystemSetting';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Helper to get system settings with defaults
async function getSetting(key: string, defaultValue: string): Promise<string> {
  const repo = AppDataSource.getRepository(SystemSetting);
  const setting = await repo.findOneBy({ key });
  return setting ? setting.value : defaultValue;
}

// Depreciation rates for Direct Imports as per provided template
const DEFAULT_DEPRECIATION_RATES: Record<number, number> = {
  0: 0.05, // Less than 1 year (Standard KRA)
  1: 0.10, // 1 year (Standard KRA)
  2: 0.20, // >1 <=2 years
  3: 0.30, // >2 <=3 years
  4: 0.40, // >3 <=4 years
  5: 0.50, // >4 <=5 years
  6: 0.55, // >5 <=6 years
  7: 0.60, // >6 <=7 years
  8: 0.65  // >7 <=8 years
};

const calculateSchema = z.object({
  crspId: z.string().uuid().optional(),
  customCrsp: z.number().optional(),
  yearOfManufacture: z.number().int(),
  engineSize: z.number(),
  fuelType: z.string(),
  vehicleType: z.enum(['CAR', 'MOTORCYCLE', 'ELECTRIC', 'AMBULANCE', 'TRUCK']).optional().default('CAR'),
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

    // Fetch dynamic settings if available
    const settingsStr = await getSetting('IMPORT_DEPRECIATION_RATES', JSON.stringify(DEFAULT_DEPRECIATION_RATES));
    const depreciationRates = JSON.parse(settingsStr);

    // Calculate Depreciation
    const depreciationRate = depreciationRates[age] || 0.65;
    const depreciatedValue = crspValue * (1 - depreciationRate);
    
    // Customs Value (CIF) - Usually the higher of depreciated CRSP or actual CIF
    const cif = data.cifValue || depreciatedValue;

    // Tax Rates based on Template (can also be moved to settings later if needed)
    let importDutyRate = 0.35; // Standard is now 35% for most vehicles
    let exciseDutyRate = 0.20; // Default for <= 1500cc
    let fixedExcise = 0;

    if (data.vehicleType === 'MOTORCYCLE') {
      importDutyRate = 0.25;
      fixedExcise = 12953; // Fixed excise for motorcycles as per template
      exciseDutyRate = 0;
    } else if (data.vehicleType === 'ELECTRIC') {
      importDutyRate = 0.35;
      exciseDutyRate = 0.10;
    } else if (data.vehicleType === 'AMBULANCE') {
      importDutyRate = 0;
      exciseDutyRate = 0.25;
    } else if (data.vehicleType === 'TRUCK') {
      importDutyRate = 0.35;
      exciseDutyRate = 0; // Prime movers/trailers have 0 excise in template
    } else {
      // Standard Car logic
      const fuel = data.fuelType.toLowerCase();
      if (fuel === 'diesel') {
        if (data.engineSize > 2500) exciseDutyRate = 0.35;
        else if (data.engineSize > 1500) exciseDutyRate = 0.25;
        else exciseDutyRate = 0.20;
      } else if (fuel === 'electric') {
        importDutyRate = 0.35;
        exciseDutyRate = 0.10;
      } else { // Petrol/Hybrid
        if (data.engineSize > 3000) exciseDutyRate = 0.35;
        else if (data.engineSize > 1500) exciseDutyRate = 0.25;
        else exciseDutyRate = 0.20;
      }
    }

    const vatRate = Number(await getSetting('IMPORT_VAT_RATE', '0.16'));
    const idfRate = Number(await getSetting('IMPORT_IDF_RATE', '0.025'));
    const rdlRate = Number(await getSetting('IMPORT_RDL_RATE', '0.02'));

    // Calculations
    const importDuty = cif * importDutyRate;
    const exciseValue = cif + importDuty;
    const exciseDuty = fixedExcise > 0 ? fixedExcise : (exciseValue * exciseDutyRate);
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
        exciseDutyRate: fixedExcise > 0 ? 0 : exciseDutyRate,
        fixedExcise,
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
    const { make, model, year, search, page = 1, limit = 50 } = req.query;
    const crspRepo = AppDataSource.getRepository(CrspData);
    
    const query = crspRepo.createQueryBuilder('crsp');

    if (make) query.andWhere('crsp.make = :make', { make });
    if (model) query.andWhere('crsp.model = :model', { model });
    if (year) query.andWhere('crsp.year = :year', { year: Number(year) });
    
    if (search) {
      query.andWhere('(crsp.make ILIKE :search OR crsp.model ILIKE :search)', { search: `%${search}%` });
    }

    const [results, total] = await query
      .orderBy('crsp.make', 'ASC')
      .addOrderBy('crsp.model', 'ASC')
      .addOrderBy('crsp.year', 'DESC')
      .skip((Number(page) - 1) * Number(limit))
      .take(Number(limit))
      .getManyAndCount();

    res.json({ results, total, page: Number(page), limit: Number(limit) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get unique makes
router.get('/crsp/makes', async (req, res) => {
  try {
    const crspRepo = AppDataSource.getRepository(CrspData);
    const makes = await crspRepo.createQueryBuilder('crsp')
      .select('DISTINCT crsp.make', 'make')
      .orderBy('make', 'ASC')
      .getRawMany();
    res.json(makes.map(m => m.make));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get unique models for a make
router.get('/crsp/models', async (req, res) => {
  try {
    const { make } = req.query;
    if (!make) return res.status(400).json({ error: 'Make is required' });
    
    const crspRepo = AppDataSource.getRepository(CrspData);
    const models = await crspRepo.createQueryBuilder('crsp')
      .select('DISTINCT crsp.model', 'model')
      .where('crsp.make = :make', { make })
      .orderBy('model', 'ASC')
      .getRawMany();
    res.json(models.map(m => m.model));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get unique years for a make and model
router.get('/crsp/years', async (req, res) => {
  try {
    const { make, model } = req.query;
    if (!make || !model) return res.status(400).json({ error: 'Make and model are required' });
    
    const crspRepo = AppDataSource.getRepository(CrspData);
    const years = await crspRepo.createQueryBuilder('crsp')
      .select('DISTINCT crsp.year', 'year')
      .where('crsp.make = :make', { make })
      .andWhere('crsp.model = :model', { model })
      .orderBy('year', 'DESC')
      .getRawMany();
    res.json(years.map(y => y.year));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update single CRSP record (Admin only)
router.put('/crsp/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const id = req.params.id as string;
    const crspRepo = AppDataSource.getRepository(CrspData);
    const crsp = await crspRepo.findOneBy({ id });
    
    if (!crsp) return res.status(404).json({ error: 'Record not found' });
    
    crspRepo.merge(crsp, req.body);
    await crspRepo.save(crsp);
    res.json(crsp);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete single CRSP record (Admin only)
router.delete('/crsp/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const crspRepo = AppDataSource.getRepository(CrspData);
    await crspRepo.delete(id);
    res.json({ message: 'Record deleted successfully' });
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
    
    // Batch upsert logic (for simplicity, we'll just save)
    // In a real app, we might want to check for duplicates
    const entities = crspRepo.create(data);
    await crspRepo.save(entities);

    res.json({ message: `Successfully uploaded ${entities.length} CRSP records` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Settings Endpoints
router.get('/settings', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const repo = AppDataSource.getRepository(SystemSetting);
    const settings = await repo.find();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/settings', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { key, value, description } = req.body;
    const repo = AppDataSource.getRepository(SystemSetting);
    let setting = await repo.findOneBy({ key });
    
    if (setting) {
      setting.value = value;
      if (description) setting.description = description;
    } else {
      setting = repo.create({ key, value, description });
    }
    
    await repo.save(setting);
    res.json(setting);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
