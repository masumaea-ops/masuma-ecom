
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
import { OrderItem } from '../entities/OrderItem';
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

// --- 5 Blog Posts ---
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
    },
    {
        title: 'When to Replace Your Wiper Blades',
        excerpt: 'Don\'t wait for the rainy season. Streaking, squeaking, and skipping are signs your blades are dead. Masuma Hybrid blades offer the best solution.',
        content: '<p>Rubber deteriorates in the African sun. If your wipers leave streaks or miss spots, they are a safety hazard. Masuma Hybrid blades combine the aerodynamics of a beam blade with the sturdy frame of a conventional blade, lasting 2x longer in tropical climates.</p>',
        image: 'https://images.unsplash.com/photo-1517357216930-799640240eb0?auto=format&fit=crop&w=800&q=80',
        category: 'Safety',
        readTime: '2 min read',
        relatedProductCategory: 'Wiper Blades'
    },
    {
        title: 'Iridium vs. Nickel Spark Plugs',
        excerpt: 'Is the extra cost worth it? We break down the mileage and performance benefits of upgrading to Masuma Iridium plugs.',
        content: '<p>Standard nickel plugs last about 20,000 km. Masuma Iridium plugs can go up to 100,000 km. While they cost more upfront, the fuel savings and reduced misfires make them the smarter choice for Nairobi traffic where idling causes carbon buildup.</p>',
        image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
        category: 'Performance',
        readTime: '4 min read',
        relatedProductCategory: 'Engine & Ignition'
    }
];

const HERO_SLIDES_DATA = [
    {
        id: 'slide-1',
        title: 'JAPANESE\nPRECISION.\nKENYAN GRIT.',
        subtitle: "Upgrade your ride with parts engineered to survive Nairobi's toughest roads. From suspension to filtration, choose the brand trusted by mechanics worldwide.",
        image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
        ctaText: 'Browse Catalog',
        ctaLink: 'CATALOG'
    },
    {
        id: 'slide-2',
        title: 'CERAMIC BRAKING\nPOWER.',
        subtitle: 'Stop faster and quieter with Masuma Ceramic Brake Pads. Engineered for high heat resistance and low dust generation.',
        image: 'https://masuma.com/wp-content/uploads/2021/09/MS-2444_1.jpg',
        ctaText: 'Shop Brakes',
        ctaLink: 'CATALOG'
    },
    {
        id: 'slide-3',
        title: 'REINFORCED\nSUSPENSION.',
        subtitle: 'Bushings and joints designed for rough terrain. Restore your vehicle handling and comfort today.',
        image: 'https://masuma.com/wp-content/uploads/2021/09/ML-3320_1.jpg',
        ctaText: 'View Suspension',
        ctaLink: 'CATALOG'
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
            name: 'Ruby Mall Branch',
            code: 'NBI-HQ',
            address: 'Ruby Mall, Shop FF25 First Floor Behind NCBA Bank Accra Road',
            phone: '+254 792 506 590'
        });
        await branchRepo.save(hq);
        console.log('Branch created.');
    }

    // 2a. Create or Update System Admin
    const userRepo = AppDataSource.getRepository(User);
    const adminEmail = 'admin@masuma.africa';
    let admin = await userRepo.findOneBy({ email: adminEmail });
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
        admin.passwordHash = passwordHash;
        await userRepo.save(admin);
        console.log(`Admin password reset to "${defaultPassword}".`);
    }

    // 2b. Create Mbaru Tech Admin
    const mbaruEmail = 'mbarutech@gmail.com';
    let mbaruUser = await userRepo.findOneBy({ email: mbaruEmail });
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
        mbaruUser.passwordHash = mbaruHash;
        mbaruUser.role = UserRole.ADMIN; 
        await userRepo.save(mbaruUser);
        console.log(`Security credentials updated for: ${mbaruEmail}`);
    }

    // 3. Create Categories & Products
    const categoryRepo = AppDataSource.getRepository(Category);
    const productRepo = AppDataSource.getRepository(Product);
    const stockRepo = AppDataSource.getRepository(ProductStock);
    const vehicleRepo = AppDataSource.getRepository(Vehicle);

    const savedProducts: Product[] = [];

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
            product.costPrice = pData.costPrice || 0;
            product.description = `Genuine Masuma ${pData.name}. Engineered for reliability.`;
            product.category = cat;
            product.imageUrl = pData.image;
            
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
        savedProducts.push(product);
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

    // 5. Seed Hero Slides
    const settingsRepo = AppDataSource.getRepository(SystemSetting);
    const existingSlides = await settingsRepo.findOneBy({ key: 'CMS_HERO_SLIDES' });
    if (!existingSlides) {
        const setting = new SystemSetting();
        setting.key = 'CMS_HERO_SLIDES';
        setting.value = JSON.stringify(HERO_SLIDES_DATA);
        await settingsRepo.save(setting);
        console.log('Created Default Hero Slides');
    }

    // 6. Seed Customers (New)
    const customerRepo = AppDataSource.getRepository(Customer);
    const customers = [
        { name: 'John Kamau', phone: '0722123456', email: 'john@gmail.com' },
        { name: 'Alice Wanjiku', phone: '0733654321', email: 'alice@yahoo.com' },
        { name: 'AutoExpress Garage', phone: '0711000000', email: 'procurement@autoexpress.co.ke', isWholesale: true }
    ];

    const savedCustomers = [];
    for (const cData of customers) {
        let customer = await customerRepo.findOneBy({ phone: cData.phone });
        if (!customer) {
            customer = customerRepo.create(cData);
            await customerRepo.save(customer);
            console.log(`Created customer: ${cData.name}`);
        }
        savedCustomers.push(customer);
    }

    // 7. Seed Sales and Orders (New)
    // Create a few dummy sales for the dashboard
    const saleRepo = AppDataSource.getRepository(Sale);
    const orderRepo = AppDataSource.getRepository(Order);
    
    // Check if sales exist
    const salesCount = await saleRepo.count();
    if (salesCount === 0 && savedProducts.length > 0) {
        console.log('Seeding initial sales data...');
        
        // Sale 1
        const sale1 = new Sale();
        sale1.receiptNumber = 'RCP-SEED-001';
        sale1.branch = hq;
        sale1.cashier = admin;
        sale1.customer = savedCustomers[0];
        sale1.customerName = savedCustomers[0].name;
        sale1.paymentMethod = 'MPESA';
        sale1.totalAmount = savedProducts[0].price * 2 + savedProducts[1].price;
        sale1.netAmount = sale1.totalAmount / 1.16;
        sale1.taxAmount = sale1.totalAmount - sale1.netAmount;
        sale1.itemsCount = 2;
        sale1.itemsSnapshot = [
            { productId: savedProducts[0].id, name: savedProducts[0].name, quantity: 2, price: savedProducts[0].price },
            { productId: savedProducts[1].id, name: savedProducts[1].name, quantity: 1, price: savedProducts[1].price }
        ];
        sale1.kraControlCode = 'KRA-SEED-001';
        await saleRepo.save(sale1);

        // Order 1 (Pending)
        const order1 = new Order();
        order1.orderNumber = 'ORD-SEED-001';
        order1.customerName = 'David Odhiambo';
        order1.customerEmail = 'david@gmail.com';
        order1.customerPhone = '0700111222';
        order1.status = OrderStatus.PENDING;
        order1.totalAmount = savedProducts[2].price;
        order1.shippingAddress = 'Westlands';
        order1.items = [
            { product: savedProducts[2], quantity: 1, price: savedProducts[2].price } as any
        ];
        await orderRepo.save(order1);

        console.log('Sales and Orders seeded.');
    }

    console.log('Seeding complete.');
    console.log('1. Admin: admin@masuma.africa / password');
    console.log('2. Admin: mbarutech@gmail.com / jesuslord1J');
    (process as any).exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    (process as any).exit(1);
  }
};

seed();
