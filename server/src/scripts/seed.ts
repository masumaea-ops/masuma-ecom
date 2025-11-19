
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
  },
  {
    name: 'Stabilizer Link',
    sku: 'ML-3320',
    category: 'Suspension',
    price: 1800,
    oems: ['48820-42020'],
    fits: [{ make: 'Toyota', model: 'RAV4' }]
  },
  {
    name: 'Iridium Spark Plug',
    sku: 'S-102',
    category: 'Engine & Ignition',
    price: 1200,
    oems: ['90919-01210'],
    fits: [{ make: 'Toyota', model: 'Camry' }, { make: 'Lexus', model: 'RX' }]
  }
];

const BLOG_DATA = [
    {
        title: 'Why Suspension Parts Fail Faster in Nairobi',
        excerpt: 'The combination of potholes, speed bumps, and dust creates a harsh environment for bushings and shocks. Learn how Masuma reinforced parts extend lifespan.',
        content: '<p>Driving in Nairobi is a test of endurance for any vehicle. The constant vibration from uneven surfaces causes standard rubber bushings to crack prematurely.</p><p>Masuma suspension parts use a high-density rubber compound specifically engineered for these conditions, offering 30% longer life than standard aftermarket alternatives.</p>',
        image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80',
        category: 'Maintenance',
        readTime: '4 min read',
        relatedProductCategory: 'Suspension'
    },
    {
        title: 'Spotting Fake Oil Filters: A Guide',
        excerpt: 'Counterfeit filters are flooding Kirinyaga Road. Here is how to identify a genuine Masuma filter and save your engine from catastrophe.',
        content: '<p>A fake oil filter might look identical on the outside, but inside, the filtration media is often just cardboard. This leads to sludge buildup and eventual engine failure.</p><p>Genuine Masuma filters feature a hologram seal and a specific batch number printed on the canister. Always buy from authorized distributors.</p>',
        image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80',
        category: 'Advisory',
        readTime: '3 min read',
        relatedProductCategory: 'Filters'
    },
    {
        title: 'Brake Pad Bedding-In Procedure',
        excerpt: 'Just installed new pads? Do not slam on the brakes yet. Follow this procedure to ensure optimal stopping power and silence.',
        content: '<p>Bedding-in transfers a layer of friction material to the rotor. Accelerate to 60kph, then brake moderately to 10kph. Repeat 10 times without coming to a complete stop.</p><p>This prevents squeaking and ensures your Masuma ceramic pads perform at their peak immediately.</p>',
        image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80',
        category: 'Technical',
        readTime: '5 min read',
        relatedProductCategory: 'Brakes'
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

    // 4. Create Blog Posts
    const blogRepo = AppDataSource.getRepository(BlogPost);
    for (const bData of BLOG_DATA) {
        const exists = await blogRepo.findOneBy({ title: bData.title });
        if (!exists) {
            const post = blogRepo.create(bData);
            await blogRepo.save(post);
            console.log(`Created blog post: ${bData.title}`);
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
