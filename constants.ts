
import { Category, Product, BlogPost } from './types';

export const PRODUCTS: Product[] = [
  // FILTERS
  {
    id: '1',
    name: 'Oil Filter (Spin-on)',
    sku: 'MFC-112',
    oemNumbers: ['90915-10001', '90915-YZZE1', '90915-10003'],
    category: Category.FILTERS,
    price: 850,
    description: 'High-efficiency oil filter with anti-drain back valve. Essential for stop-and-go Nairobi traffic.',
    compatibility: ['Toyota Corolla (NZE, Fielder)', 'Toyota Vitz', 'Toyota Premio', 'Toyota Allion 1.5/1.8'],
    image: 'https://masuma.com/wp-content/uploads/2021/09/MFC-112_1.jpg',
    stock: true,
  },
  {
    id: '2',
    name: 'Air Filter (Safari Spec)',
    sku: 'MFA-331',
    oemNumbers: ['17801-30040', '17801-0L040'],
    category: Category.FILTERS,
    price: 2200,
    description: 'Multi-layer filtration material designed for high-dust environments like Tsavo or Kajiado.',
    compatibility: ['Toyota Land Cruiser Prado (KDJ120)', 'Toyota Hilux Vigo', 'Toyota Hiace KD200'],
    image: 'https://masuma.com/wp-content/uploads/2021/09/MFA-331_1.jpg',
    stock: true,
  },
  {
    id: '18',
    name: 'Fuel Filter (In-Tank)',
    sku: 'MFF-T103',
    oemNumbers: ['23300-21010', '23300-0D030'],
    category: Category.FILTERS,
    price: 3500,
    description: 'In-tank fuel filter ensuring clean fuel delivery for EFI engines.',
    compatibility: ['Toyota Vitz (SCP10)', 'Toyota Platz', 'Toyota FunCargo'],
    image: 'https://masuma.com/wp-content/uploads/2021/09/MFF-T103_1.jpg',
    stock: true,
  },

  // BRAKES
  {
    id: '3',
    name: 'Disc Brake Pads (Front)',
    sku: 'MS-2444',
    oemNumbers: ['26296-SA031', '26296-SA030', '26296-FG010'],
    category: Category.BRAKES,
    price: 4500,
    description: 'Ceramic compound pads. Low dust, noise-free, and heat resistant for highway braking.',
    compatibility: ['Subaru Forester (SG5/SH5)', 'Subaru Impreza', 'Subaru Legacy'],
    image: 'https://masuma.com/wp-content/uploads/2021/09/MS-2444_1.jpg',
    stock: true,
  },
  {
    id: '4',
    name: 'Brake Shoes (Rear)',
    sku: 'MK-4420',
    oemNumbers: ['D4060-ED000', 'D4060-JA00A'],
    category: Category.BRAKES,
    price: 3200,
    description: 'High friction coefficient rear brake shoes. Durable bonding.',
    compatibility: ['Nissan Tiida', 'Nissan Note (E11)', 'Nissan Wingroad'],
    image: 'https://masuma.com/wp-content/uploads/2021/09/MK-4420_1.jpg',
    stock: true,
  },
  {
    id: '19',
    name: 'Brake Disc Rotor (Front)',
    sku: 'MDR-9901',
    oemNumbers: ['43512-48110', '43512-0E030'],
    category: Category.BRAKES,
    price: 8500,
    description: 'Ventilated disc rotor. Precision balanced to prevent steering vibration.',
    compatibility: ['Toyota Harrier (ACU30)', 'Toyota Kluger', 'Lexus RX'],
    image: 'https://masuma.com/wp-content/uploads/2021/09/MDR-9901_1.jpg',
    stock: true,
  },

  // SUSPENSION & CHASSIS
  {
    id: '5',
    name: 'Stabilizer Link (Front Right)',
    sku: 'ML-3920R',
    oemNumbers: ['51320-SAA-003', '51320-SEL-T01'],
    category: Category.SUSPENSION,
    price: 1800,
    description: 'Reinforced ball joint structure to withstand potholes and bumps.',
    compatibility: ['Honda Fit (GD1/GE6)', 'Honda Airwave', 'Honda Mobilio'],
    image: 'https://masuma.com/wp-content/uploads/2021/09/ML-3920R_1.jpg',
    stock: true,
  },
  {
    id: '6',
    name: 'Control Arm Bushing (Small)',
    sku: 'RU-455',
    oemNumbers: ['D651-34-460B', 'D651-34-460'],
    category: Category.SUSPENSION,
    price: 1200,
    description: 'High-grade rubber bushing. Restores suspension firmness and handling.',
    compatibility: ['Mazda Demio (DE/DJ)', 'Mazda Axela', 'Mazda Verisa'],
    image: 'https://masuma.com/wp-content/uploads/2021/09/RU-455_1.jpg',
    stock: false,
  },
  {
    id: '20',
    name: 'Ball Joint (Lower)',
    sku: 'MB-3812',
    oemNumbers: ['43330-29375', '43330-09590'],
    category: Category.SUSPENSION,
    price: 2800,
    description: 'Precision machined ball joint for smooth steering response.',
    compatibility: ['Toyota Hiace (KDH200)', 'Toyota Regius Ace'],
    image: 'https://masuma.com/wp-content/uploads/2021/09/MB-3812_1.jpg',
    stock: true,
  },

  // ENGINE & IGNITION
  {
    id: '7',
    name: 'Iridium Spark Plug',
    sku: 'S-101',
    oemNumbers: ['22401-ED815', '22401-1KT1B', 'FXE20HR11'],
    category: Category.ENGINE,
    price: 1400,
    description: 'Long-life iridium tip (100k km). Improves fuel economy.',
    compatibility: ['Nissan Note', 'Nissan X-Trail', 'Nissan Tiida', 'Nissan Sylphy'],
    image: 'https://masuma.com/wp-content/uploads/2021/09/S-101_1.jpg',
    stock: true,
  },
  {
    id: '8',
    name: 'Ignition Coil',
    sku: 'MIC-108',
    oemNumbers: ['90919-02240', '90919-02265'],
    category: Category.ENGINE,
    price: 4500,
    description: 'High voltage output for consistent combustion. Solves misfire issues.',
    compatibility: ['Toyota Vitz (1NZ-FE)', 'Toyota Corolla NZE', 'Toyota Raum'],
    image: 'https://masuma.com/wp-content/uploads/2021/09/MIC-108_1.jpg',
    stock: true,
  },

  // WIPERS
  {
    id: '9',
    name: 'Hybrid Wiper Blade 24"',
    sku: 'MU-024H',
    oemNumbers: ['85212-YZZF1', '85222-53070'],
    category: Category.WIPERS,
    price: 1500,
    description: 'Aerodynamic hybrid design. Perfect for tropical rain seasons.',
    compatibility: ['Universal Hook Type', 'Toyota Harrier (Driver)', 'Subaru Forester (Driver)'],
    image: 'https://masuma.com/wp-content/uploads/2021/09/MU-024H_1.jpg',
    stock: true,
  },
  {
    id: '10',
    name: 'Rear Wiper Blade 12"',
    sku: 'MU-12R',
    oemNumbers: ['85242-12090'],
    category: Category.WIPERS,
    price: 900,
    description: 'Specialized rear wiper for hatchbacks and SUVs.',
    compatibility: ['Toyota Vitz', 'Toyota Auris', 'Mazda Demio'],
    image: 'https://masuma.com/wp-content/uploads/2021/09/MU-12R_1.jpg',
    stock: true,
  },

  // COOLING
  {
    id: '11',
    name: 'Radiator Cap (1.1 Bar)',
    sku: 'MOX-203',
    oemNumbers: ['16401-20353', '16401-72090'],
    category: Category.COOLING,
    price: 650,
    description: 'Standard small valve type. Maintains optimal pressure to prevent overheating.',
    compatibility: ['Toyota', 'Honda', 'Suzuki', 'Mazda (Most Models)'],
    image: 'https://masuma.com/wp-content/uploads/2021/09/MOX-203_1.jpg',
    stock: true,
  },
  {
    id: '12',
    name: 'Thermostat (82°C)',
    sku: 'WV-56TA-82',
    oemNumbers: ['90916-03093', '90916-03129'],
    category: Category.COOLING,
    price: 1800,
    description: 'Precise temperature control valve. Includes gasket.',
    compatibility: ['Toyota 1AZ/2AZ Engines', 'Rav4', 'Harrier', 'Camry'],
    image: 'https://masuma.com/wp-content/uploads/2021/09/WV-56TA-82_1.jpg',
    stock: true,
  },

  // FASTENERS & CLIPS
  {
    id: '13',
    name: 'Bumper Clip Assortment (10pcs)',
    sku: 'KJ-1013',
    oemNumbers: ['52161-16010'],
    category: Category.FASTENERS,
    price: 500,
    description: 'Common push-type retainer for bumpers and splash guards.',
    compatibility: ['Toyota Universal', 'Lexus Universal'],
    image: 'https://masuma.com/wp-content/uploads/2021/09/KJ-1013_1.jpg',
    stock: true,
  },
  
  // BELTS
  {
    id: '14',
    name: 'V-Ribbed Belt (Fan Belt)',
    sku: '4PK1210',
    oemNumbers: ['99364-21210', '90916-02556'],
    category: Category.BELTS,
    price: 1600,
    description: 'EPDM rubber belt, noise-free and resistant to stretching.',
    compatibility: ['Toyota Corolla NZE121 (1NZ-FE)'],
    image: 'https://masuma.com/wp-content/uploads/2021/09/4PK1210_1.jpg',
    stock: true,
  },
  {
    id: '15',
    name: 'Serpentine Belt',
    sku: '7PK1935',
    oemNumbers: ['90916-02600', '90916-T2006'],
    category: Category.BELTS,
    price: 3800,
    description: 'Main drive belt for alternator and pumps.',
    compatibility: ['Toyota Hilux (2GD/1GD)', 'Toyota Fortuner'],
    image: 'https://masuma.com/wp-content/uploads/2021/09/7PK1935_1.jpg',
    stock: true,
  }
];

export const FEATURED_PRODUCTS = PRODUCTS.filter(p => p.stock).slice(0, 4);

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'Why Your Brakes Squeak in Nairobi (And How to Fix It)',
    excerpt: 'Dust and heat are the enemies of your braking system. Discover why ceramic pads are the superior choice for East African roads.',
    content: `
      <p class="mb-4">If you drive in Nairobi, you know the sound: a high-pitched squeal every time you tap the brakes at a matatu stop. It's annoying, but it can also be a sign of danger.</p>
      <h3 class="text-xl font-bold text-masuma-dark mt-6 mb-3">The Culprit: Dust and Glazing</h3>
      <p class="mb-4">Nairobi's roads are dusty. When standard semi-metallic brake pads get hot (like when you're coming down from Limuru or braking constantly on Mombasa Road), the dust fuses with the brake pad surface. This creates a hard, glassy layer called "glazing."</p>
      <p class="mb-4">Glazed pads don't grip the rotor properly; they slide and vibrate, causing that terrible noise.</p>
      <h3 class="text-xl font-bold text-masuma-dark mt-6 mb-3">The Solution: Masuma Ceramic Pads</h3>
      <p class="mb-4">At Masuma, we engineered our pads specifically for these conditions. Our ceramic compound dissipates heat 30% faster than standard pads. More importantly, they produce significantly less dust.</p>
      <p class="mb-4">Less dust means cleaner wheels, no squeaking, and a longer lifespan for your rotors. It's an upgrade your ears (and your safety) will thank you for.</p>
    `,
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
    date: 'Oct 12, 2023',
    readTime: '4 min read',
    category: 'Maintenance',
    relatedProductCategory: Category.BRAKES
  },
  {
    id: '2',
    title: 'Suspension Survival Guide: Handling Potholes',
    excerpt: 'Your bushings take a beating every day. Learn how Masuma reinforced rubber technology extends the life of your suspension.',
    content: `
      <p class="mb-4">We've all hit that hidden pothole on Enterprise Road that felt like it broke the car in half. While your shocks take the big hits, your <strong>control arm bushings</strong> take the constant vibration.</p>
      <h3 class="text-xl font-bold text-masuma-dark mt-6 mb-3">Why Rubber Quality Matters</h3>
      <p class="mb-4">Cheap aftermarket bushings use recycled rubber mixed with too much plastic filler. In Kenya's hot climate, these dry out and crack within months. Once a bushing cracks, your alignment goes off, your tires wear unevenly, and your steering feels loose.</p>
      <h3 class="text-xl font-bold text-masuma-dark mt-6 mb-3">The Masuma Difference</h3>
      <p class="mb-4">Masuma bushings are cured at specific temperatures to maintain flexibility without losing strength. We test them to withstand -40°C to +80°C. For a Toyota Vitz or Demio that serves as a daily driver, this means steering that stays tight for years, not months.</p>
    `,
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    date: 'Nov 05, 2023',
    readTime: '3 min read',
    category: 'Technical',
    relatedProductCategory: Category.SUSPENSION
  },
  {
    id: '3',
    title: 'Spotting Counterfeits: Don\'t Get Cheated',
    excerpt: 'The market is flooded with fake parts in branded boxes. Here is how to verify you are buying genuine Masuma quality.',
    content: `
      <p class="mb-4">It is an unfortunate reality: if a brand is popular, it will be copied. We have seen "Masuma" filters in downtown shops that are nothing more than painted tin cans with toilet paper inside.</p>
      <h3 class="text-xl font-bold text-masuma-dark mt-6 mb-3">Check the Weight</h3>
      <p class="mb-4">A genuine Masuma oil filter is heavy. It contains a thick steel casing, a high-pressure relief valve, and dense filtration media. Fakes feel light and flimsy.</p>
      <h3 class="text-xl font-bold text-masuma-dark mt-6 mb-3">The QR Code</h3>
      <p class="mb-4">Every genuine Masuma box comes with a QR code that links directly to our global catalog validation page. If the code doesn't scan, or takes you to a generic page, walk away.</p>
      <p class="mb-4">Buy directly from Masuma Autoparts East Africa Limited to guarantee your warranty and your safety.</p>
    `,
    image: 'https://images.unsplash.com/photo-1635784063258-d984f9b0909d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    date: 'Dec 15, 2023',
    readTime: '5 min read',
    category: 'Consumer Advice',
    relatedProductCategory: Category.FILTERS
  }
];
