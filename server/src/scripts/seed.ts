
import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Branch } from '../entities/Branch';
import { User, UserRole } from '../entities/User';
import { Category } from '../entities/Category';
import { Product } from '../entities/Product';
import { ProductStock } from '../entities/ProductStock';
import { OemNumber } from '../entities/OemNumber';
import { Vehicle } from '../entities/Vehicle';
import { Security } from '../utils/security';

// Mock Data Source
const PRODUCTS_DATA = [
  {
    name: 'Oil Filter (Spin-on)',
    sku: 'MFC-112',
    category: 'Filters',
    price: 850,
    oems: ['90915-10001', '90915-YZZE1'],
    fits: [{ make: 'Toyota', model: 'Corolla' }, { make: 'Toyota', model: 'Vitz' }]
  },
  {
    name: 'Disc Brake Pads (Front)',
    sku: 'MS-2444',
    category: 'Brakes',
    price: 4500,
    oems: ['26296-SA031', '26296-FG010'],
    fits: [{ make: 'Subaru', model: 'Forester' }, { make: 'Subaru', model: 'Impreza' }]
  },
  {
    name: 'Air Filter (Safari Spec)',
    sku: 'MFA-331',
    category: 'Filters',
    price: 2200,
    oems: ['17801-30040'],
    fits: [{ make: 'Toyota', model: 'Prado' }]
  }
];

const seed = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connected. Starting seed...');

    // 1. Create Branch
    const branchRepo = AppDataSource.getRepository(Branch);
    let hq = await branchRepo.findOneBy({ code: 'NBI-HQ' });
    if (!hq) {
        hq = branchRepo.create({
            name: 'Nairobi Industrial HQ',
            code: 'NBI-HQ',
            address: 'Godown 4, Enterprise Road',
            phone: '+254 700 123 456'
        });
        await branchRepo.save(hq);
        console.log('Branch created.');
    }

    // 2. Create Admin User
    const userRepo = AppDataSource.getRepository(User);
    const adminEmail = 'admin@masuma.africa';
    let admin = await userRepo.findOneBy({ email: adminEmail });
    if (!admin) {
        admin = userRepo.create({
            email: adminEmail,
            fullName: 'System Admin',
            passwordHash: await Security.hashPassword('password'), 
            role: UserRole.ADMIN,
            branch: hq
        });
        await userRepo.save(admin);
        console.log('Admin user created (admin@masuma.africa / password).');
    }

    // 3. Create Categories & Products
    const categoryRepo = AppDataSource.getRepository(Category);
    const productRepo = AppDataSource.getRepository(Product);
    const stockRepo = AppDataSource.getRepository(ProductStock);
    const vehicleRepo = AppDataSource.getRepository(Vehicle);

    for (const pData of PRODUCTS_DATA) {
        // Category
        let cat = await categoryRepo.findOneBy({ name: pData.category });
        if (!cat) {
            cat = categoryRepo.create({ name: pData.category });
            await categoryRepo.save(cat);
        }

        // Product
        let product = await productRepo.findOneBy({ sku: pData.sku });
        if (!product) {
            product = new Product();
            product.name = pData.name;
            product.sku = pData.sku;
            product.price = pData.price;
            product.description = `Genuine Masuma ${pData.name}`;
            product.category = cat;
            product.imageUrl = 'https://masuma.com/wp-content/uploads/2021/09/MFC-112_1.jpg'; // Placeholder
            
            // OEMs
            product.oemNumbers = pData.oems.map(code => {
                const o = new OemNumber();
                o.code = code;
                return o;
            });

            // Vehicles
            const vehicles = [];
            for (const vData of pData.fits) {
                let v = await vehicleRepo.findOneBy({ make: vData.make, model: vData.model });
                if (!v) {
                    v = vehicleRepo.create(vData);
                    await vehicleRepo.save(v);
                }
                vehicles.push(v);
            }
            product.vehicles = vehicles;

            await productRepo.save(product);
            
            // Initial Stock
            const stock = stockRepo.create({
                product,
                branch: hq,
                quantity: 100,
                lowStockThreshold: 10
            });
            await stockRepo.save(stock);
            
            console.log(`Created product: ${product.sku}`);
        }
    }

    console.log('Seeding complete.');
    (process as any).exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    (process as any).exit(1);
  }
};

seed();
