
import * as dotenv from 'dotenv';
dotenv.config();

import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Branch } from '../entities/Branch';
import { User, UserRole } from '../entities/User';
import { Category } from '../entities/Category';
import { Product } from '../entities/Product';
import { ProductStock } from '../entities/ProductStock';
import { OemNumber } from '../entities/OemNumber';
import { Vehicle } from '../entities/Vehicle';
import { BlogPost } from '../entities/BlogPost';
import { SystemSetting } from '../entities/SystemSetting';
import { Customer } from '../entities/Customer';
import { Sale } from '../entities/Sale';
import { Order, OrderStatus } from '../entities/Order';
import { Security } from '../utils/security';

// --- 10 Sample Masuma Products ---
const PRODUCTS_DATA = [
  {
    name: 'Oil Filter (Spin-on)',
    sku: 'MFC-112',
    category: 'Filters',
    price: 850,
    costPrice: 450,
    oems: ['90915-10001', '90915-YZZE1'],
    fits: [{ make: 'Toyota', model: 'Corolla' }, { make: 'Toyota', model: 'Vitz' }, { make: 'Toyota', model: 'Premio' }],
    image: 'https://masuma.com/wp-content/uploads/2021/09/MFC-112_1.jpg'
  },
  {
    name: 'Disc Brake Pads (Front)',
    sku: 'MS-2444',
    category: 'Brakes',
    price: 4500,
    costPrice: 2800,
    oems: ['26296-SA031', '26296-FG010'],
    fits: [{ make: 'Subaru', model: 'Forester SG5' }, { make: 'Subaru', model: 'Impreza' }],
    image: 'https://masuma.com/wp-content/uploads/2021/09/MS-2444_1.jpg'
  },
  {
    name: 'Air Filter (Safari Spec)',
    sku: 'MFA-1146',
    category: 'Filters',
    price: 2200,
    costPrice: 1100,
    oems: ['17801-30040'],
    fits: [{ make: 'Toyota', model: 'Land Cruiser Prado' }, { make: 'Toyota', model: 'Hilux' }],
    image: 'https://masuma.com/wp-content/uploads/2021/09/MFA-1146_1.jpg'
  },
  {
    name: 'Stabilizer Link (Front)',
    sku: 'ML-3320',
    category: 'Suspension',
    price: 1800,
    costPrice: 950,
    oems: ['48820-42020'],
    fits: [{ make: 'Toyota', model: 'RAV4' }, { make: 'Toyota', model: 'Vanguard' }],
    image: 'https://masuma.com/wp-content/uploads/2021/09/ML-3320_1.jpg'
  },
  {
    name: 'Iridium Spark Plug',
    sku: 'S-102',
    category: 'Engine & Ignition',
    price: 1200,
    costPrice: 600,
    oems: ['90919-01210'],
    fits: [{ make: 'Toyota', model: 'Camry' }, { make: 'Lexus', model: 'RX' }, { make: 'Nissan', model: 'X-Trail' }],
    image: 'https://masuma.com/wp-content/uploads/2021/09/S-102_1.jpg'
  },
  {
    name: 'Hybrid Wiper Blade (26")',
    sku: 'MU-026',
    category: 'Wiper Blades',
    price: 1500,
    costPrice: 800,
    oems: ['85222-53070'],
    fits: [{ make: 'Toyota', model: 'Harrier' }, { make: 'Honda', model: 'CR-V' }, { make: 'Nissan', model: 'Murano' }],
    image: 'https://masuma.com/wp-content/uploads/2021/09/MU-026_1.jpg'
  },
  {
    name: 'Fuel Filter (In-Tank)',
    sku: 'MFF-T103',
    category: 'Filters',
    price: 3500,
    costPrice: 1900,
    oems: ['23300-21010'],
    fits: [{ make: 'Toyota', model: 'NZE' }, { make: 'Toyota', model: 'Fielder' }, { make: 'Toyota', model: 'Runx' }],
    image: 'https://masuma.com/wp-content/uploads/2021/09/MFF-T103_1.jpg'
  },
  {
    name: 'Control Arm Bushing',
    sku: 'RU-388',
    category: 'Suspension',
    price: 1200,
    costPrice: 550,
    oems: ['48655-12170'],
    fits: [{ make: 'Toyota', model: 'Corolla AE100' }, { make: 'Toyota', model: 'Sprinter' }],
    image: 'https://masuma.com/wp-content/uploads/2021/09/RU-388_1.jpg'
  },
  {
    name: 'Ignition Coil',
    sku: 'MIC-110',
    category: 'Engine & Ignition',
    price: 4800,
    costPrice: 2400,
    oems: ['90919-02240'],
    fits: [{ make: 'Toyota', model: 'Vitz' }, { make: 'Toyota', model: 'Yaris' }, { make: 'Toyota', model: 'FunCargo' }],
    image: 'https://masuma.com/wp-content/uploads/2021/09/MIC-110_1.jpg'
  },
  {
    name: 'Drive Belt (Serpentine)',
    sku: '5PK1100',
    category: 'Drive Belts',
    price: 1600,
    costPrice: 750,
    oems: ['90916-02556'],
    fits: [{ make: 'Toyota', model: 'Premio' }, { make: 'Toyota', model: 'Allion' }],
    image: 'https://masuma.com/wp-content/uploads/2021/09/5PK1100_1.jpg'
  }
];

const seed = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connected. Starting seed / recovery...');

    // 1. Create Branch
    const branchRepo = AppDataSource.getRepository(Branch);
    let hq = await branchRepo.findOneBy({ code: 'NBI-HQ' });
    if (!hq) {
        hq = branchRepo.create({
            name: 'Ruby Mall Branch',
            code: 'NBI-HQ',
            address: 'Ruby Mall, Shop FF25 First Floor Behind NCBA Bank Accra Road',
            phone: '+254 792 506 590'
        });
        await branchRepo.save(hq);
        console.log('Branch created.');
    }

    // 2a. Reset or Create System Admin
    const userRepo = AppDataSource.getRepository(User);
    const adminEmail = 'admin@masuma.africa';
    let admin = await userRepo.findOne({ where: { email: adminEmail } });
    const defaultPassword = 'password';
    const passwordHash = await Security.hashPassword(defaultPassword);

    if (!admin) {
        admin = userRepo.create({
            email: adminEmail,
            fullName: 'System Admin',
            passwordHash: passwordHash, 
            role: UserRole.ADMIN,
            branch: hq
        });
        await userRepo.save(admin);
        console.log(`Admin user created (${adminEmail} / ${defaultPassword}).`);
    } else {
        admin.passwordHash = passwordHash; // Reset password
        admin.isActive = true;
        await userRepo.save(admin);
        console.log(`Admin password RECOVERY successful: reset to "${defaultPassword}".`);
    }

    // 2b. Reset or Create Mbaru Tech Admin
    const mbaruEmail = 'mbarutech@gmail.com';
    let mbaruUser = await userRepo.findOne({ where: { email: mbaruEmail } });
    const mbaruPassword = 'jesuslord1J';
    const mbaruHash = await Security.hashPassword(mbaruPassword);

    if (!mbaruUser) {
        mbaruUser = userRepo.create({
            email: mbaruEmail,
            fullName: 'Mbaru Tech',
            passwordHash: mbaruHash,
            role: UserRole.ADMIN,
            branch: hq
        });
        await userRepo.save(mbaruUser);
        console.log(`Second Admin user created: ${mbaruEmail}`);
    } else {
        mbaruUser.passwordHash = mbaruHash; // Reset password
        mbaruUser.role = UserRole.ADMIN; 
        mbaruUser.isActive = true;
        await userRepo.save(mbaruUser);
        console.log(`Secondary Admin password RECOVERY successful: ${mbaruEmail}`);
    }

    // 3. Create Categories & Products
    const categoryRepo = AppDataSource.getRepository(Category);
    const productRepo = AppDataSource.getRepository(Product);
    const stockRepo = AppDataSource.getRepository(ProductStock);
    const vehicleRepo = AppDataSource.getRepository(Vehicle);

    const savedProducts: Product[] = [];

    for (const pData of PRODUCTS_DATA) {
        let cat = await categoryRepo.findOneBy({ name: pData.category });
        if (!cat) {
            cat = categoryRepo.create({ name: pData.category });
            await categoryRepo.save(cat);
        }

        let product = await productRepo.findOneBy({ sku: pData.sku });
        if (!product) {
            product = new Product();
            product.name = pData.name;
            product.sku = pData.sku;
            product.price = pData.price;
            product.costPrice = pData.costPrice || 0;
            product.description = `Genuine Masuma ${pData.name}. Engineered for reliability.`;
            product.category = cat;
            product.imageUrl = pData.image;
            
            product.oemNumbers = pData.oems.map(code => {
                const o = new OemNumber();
                o.code = code;
                return o;
            });

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
            
            const stock = stockRepo.create({
                product,
                branch: hq,
                quantity: 100,
                lowStockThreshold: 10
            });
            await stockRepo.save(stock);
            
            console.log(`Sync product: ${product.sku}`);
        }
        savedProducts.push(product);
    }

    // Final Sync Message
    console.log('\n✅ SYNC COMPLETE');
    console.log('--- Access Credentials ---');
    console.log(`1. ${adminEmail} : ${defaultPassword}`);
    console.log(`2. ${mbaruEmail} : ${mbaruPassword}`);
    console.log('--------------------------');
    
    (process as any).exit(0);
  } catch (error) {
    console.error('Seeding / Recovery failed:', error);
    (process as any).exit(1);
  }
};

seed();
