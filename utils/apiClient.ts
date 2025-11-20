
import axios from 'axios';

// In production, this would be your deployed backend URL
const BASE_URL = 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 2000, // Fast fail if backend is offline
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- MOCK DATA FOR OFFLINE MODE ---
const MOCK_PRODUCTS = [
  {
    id: '1',
    name: 'Oil Filter (Spin-on)',
    sku: 'MFC-112',
    category: 'Filters',
    price: 850,
    wholesalePrice: 650,
    description: 'Premium filtration for Toyota engines. High-efficiency media traps 99% of contaminants.',
    image: 'https://masuma.com/wp-content/uploads/2021/09/MFC-112_1.jpg',
    stock: true,
    oemNumbers: ['90915-10001', '90915-YZZE1'],
    compatibility: ['Toyota Corolla', 'Toyota Vitz', 'Toyota Fielder']
  },
  {
    id: '2',
    name: 'Disc Brake Pads (Front)',
    sku: 'MS-2444',
    category: 'Brakes',
    price: 4500,
    wholesalePrice: 3800,
    description: 'Ceramic compound pads for smooth braking and low dust. Heat resistant up to 600°C.',
    image: 'https://masuma.com/wp-content/uploads/2021/09/MS-2444_1.jpg',
    stock: true,
    oemNumbers: ['26296-SA031'],
    compatibility: ['Subaru Forester', 'Subaru Impreza']
  },
  {
    id: '3',
    name: 'Air Filter (Safari Spec)',
    sku: 'MFA-331',
    category: 'Filters',
    price: 2200,
    wholesalePrice: 1800,
    description: 'Reinforced structure for rough terrain. Enhanced dust holding capacity.',
    image: 'https://masuma.com/wp-content/uploads/2021/09/MFA-331_1.jpg',
    stock: true,
    oemNumbers: ['17801-30040'],
    compatibility: ['Toyota Land Cruiser Prado', 'Toyota HiAce']
  },
  {
    id: '4',
    name: 'Stabilizer Link',
    sku: 'ML-3320',
    category: 'Suspension',
    price: 1800,
    wholesalePrice: 1400,
    description: 'Heavy duty joint for African roads. Pre-greased and sealed.',
    image: 'https://masuma.com/wp-content/uploads/2021/09/ML-3320_1.jpg',
    stock: false,
    oemNumbers: ['48820-42020'],
    compatibility: ['Toyota RAV4']
  },
  {
    id: '5',
    name: 'Iridium Spark Plug',
    sku: 'S-102',
    category: 'Engine & Ignition',
    price: 1200,
    wholesalePrice: 950,
    description: 'Long life iridium tip. Improved fuel economy and acceleration.',
    image: 'https://masuma.com/wp-content/uploads/2021/09/S-102_1.jpg',
    stock: true,
    oemNumbers: ['90919-01210'],
    compatibility: ['Toyota Camry', 'Lexus RX']
  }
];

const MOCK_BLOG_POSTS = [
    {
        id: '1',
        title: 'Why Suspension Parts Fail Faster in Nairobi',
        excerpt: 'The combination of potholes, speed bumps, and dust creates a harsh environment for bushings and shocks. Learn how Masuma reinforced parts extend lifespan.',
        content: '<p>Driving in Nairobi is a test of endurance for any vehicle. The constant vibration from uneven surfaces causes standard rubber bushings to crack prematurely.</p><p>Masuma suspension parts use a high-density rubber compound specifically engineered for these conditions, offering 30% longer life than standard aftermarket alternatives.</p>',
        image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80',
        category: 'Maintenance',
        readTime: '4 min read',
        date: 'Oct 12, 2023',
        relatedProductCategory: 'Suspension'
    },
    {
        id: '2',
        title: 'Spotting Fake Oil Filters: A Guide',
        excerpt: 'Counterfeit filters are flooding Kirinyaga Road. Here is how to identify a genuine Masuma filter and save your engine from catastrophe.',
        content: '<p>A fake oil filter might look identical on the outside, but inside, the filtration media is often just cardboard. This leads to sludge buildup and eventual engine failure.</p><p>Genuine Masuma filters feature a hologram seal and a specific batch number printed on the canister. Always buy from authorized distributors.</p>',
        image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80',
        category: 'Advisory',
        readTime: '3 min read',
        date: 'Sep 28, 2023',
        relatedProductCategory: 'Filters'
    },
    {
        id: '3',
        title: 'Brake Pad Bedding-In Procedure',
        excerpt: 'Just installed new pads? Do not slam on the brakes yet. Follow this procedure to ensure optimal stopping power and silence.',
        content: '<p>Bedding-in transfers a layer of friction material to the rotor. Accelerate to 60kph, then brake moderately to 10kph. Repeat 10 times without coming to a complete stop.</p><p>This prevents squeaking and ensures your Masuma ceramic pads perform at their peak immediately.</p>',
        image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80',
        category: 'Technical',
        readTime: '5 min read',
        date: 'Aug 15, 2023',
        relatedProductCategory: 'Brakes'
    }
];

const MOCK_STATS = {
  totalSales: 254300,
  lowStockItems: 3,
  todaysOrders: 12,
  pendingQuotes: 5,
  monthlyRevenue: [
    { name: 'Jan', value: 120000 }, { name: 'Feb', value: 150000 },
    { name: 'Mar', value: 180000 }, { name: 'Apr', value: 170000 },
    { name: 'May', value: 210000 }, { name: 'Jun', value: 254300 }
  ],
  categorySales: [
    { name: 'Filters', value: 40 }, { name: 'Brakes', value: 30 },
    { name: 'Suspension', value: 20 }, { name: 'Engine', value: 10 }
  ]
};

const MOCK_USER = {
    id: 'mock-admin-id',
    name: 'Demo Admin',
    email: 'admin@masuma.africa',
    role: 'ADMIN',
    branch: { id: 'hq', name: 'Nairobi HQ' }
};

// Request Interceptor: Attach Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('masuma_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Errors & Mocks
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Handle Network Errors (Backend Down) by serving Mock Data
    if (!error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        console.warn(`Backend unreachable (${error.config.url}). Serving Mock Data.`);
        const url = error.config.url || '';

        // Mock Responses
        if (url.includes('/auth/login')) {
            return Promise.resolve({ data: { token: 'mock-token-123', user: MOCK_USER } });
        }
        if (url.includes('/products')) {
            return Promise.resolve({ data: MOCK_PRODUCTS });
        }
        if (url.includes('/blog')) {
             return Promise.resolve({ 
                 data: { 
                     data: MOCK_BLOG_POSTS, 
                     meta: { page: 1, limit: 6, total: MOCK_BLOG_POSTS.length, pages: 1 } 
                 } 
             });
        }
        if (url.includes('/admin/stats')) {
            return Promise.resolve({ data: MOCK_STATS });
        }
        if (url.includes('/settings')) {
             return Promise.resolve({ data: { CMS_HERO_TITLE: 'JAPANESE PRECISION.\nKENYAN GRIT.' } });
        }
        if (url.includes('/categories')) {
            return Promise.resolve({ data: [{id: '1', name: 'Filters'}, {id: '2', name: 'Brakes'}] });
        }
        if (url.includes('/exchange-rates')) {
            return Promise.resolve({ data: { KES: 1, USD: 0.0076, UGX: 28.5, TZS: 19.5, RWF: 9.8 } });
        }
        if (url.includes('/orders')) {
             return Promise.resolve({ data: [] });
        }
        if (url.includes('/sales')) {
             return Promise.resolve({ data: { data: [], pagination: { page: 1, total: 0, pages: 1 } } });
        }
        if (url.includes('/customers')) {
            return Promise.resolve({ data: [] });
        }
        if (url.includes('/mpesa')) {
            return Promise.resolve({ data: { message: 'Mock Payment Initiated' } });
        }
        
        // Generic success for POST/PUT/DELETE in offline mode
        if (error.config.method !== 'get') {
             return Promise.resolve({ data: { success: true, message: 'Operation simulated (Offline Mode)' } });
        }
    }

    // 2. Handle Auth Errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('masuma_auth_token');
      // Optional: Redirect to login
    }
    return Promise.reject(error);
  }
);

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
