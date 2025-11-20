
import axios, { InternalAxiosRequestConfig } from 'axios';
import { Product, Category } from '../types';

// In production, this would be your deployed backend URL
const BASE_URL = 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 5000, // Lower timeout to switch to mocks faster
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- MOCK DATA FOR OFFLINE MODE ---
const MOCK_PRODUCTS: Product[] = [
    {
        id: '1',
        name: 'Oil Filter (Spin-on)',
        sku: 'MFC-112',
        category: Category.FILTERS,
        price: 850,
        description: 'High-efficiency oil filter with anti-drain back valve.',
        compatibility: ['Toyota Corolla', 'Toyota Vitz', 'Toyota Fielder'],
        image: 'https://masuma.com/wp-content/uploads/2021/09/MFC-112_1.jpg',
        stock: true,
        oemNumbers: ['90915-10001', '90915-YZZE1']
    },
    {
        id: '2',
        name: 'Disc Brake Pads (Front)',
        sku: 'MS-2444',
        category: Category.BRAKES,
        price: 4500,
        description: 'Ceramic brake pads. Low dust, high stopping power.',
        compatibility: ['Subaru Forester', 'Subaru Impreza', 'Subaru Legacy'],
        image: 'https://masuma.com/wp-content/uploads/2021/09/MS-2444_1.jpg',
        stock: true,
        oemNumbers: ['26296-SA031']
    },
    {
        id: '3',
        name: 'Stabilizer Link',
        sku: 'ML-3320',
        category: Category.SUSPENSION,
        price: 1800,
        description: 'Reinforced steel stabilizer link for rough roads.',
        compatibility: ['Toyota RAV4', 'Toyota Harrier'],
        image: 'https://masuma.com/wp-content/uploads/2021/09/ML-3320_1.jpg',
        stock: true,
        oemNumbers: ['48820-42020']
    },
    {
        id: '4',
        name: 'Air Filter',
        sku: 'MFA-331',
        category: Category.FILTERS,
        price: 1500,
        description: 'High flow air filter.',
        compatibility: ['Toyota Prado', 'Toyota Hilux'],
        image: 'https://masuma.com/wp-content/uploads/2021/09/MFA-1146_1.jpg',
        stock: false,
        oemNumbers: ['17801-30040']
    },
    {
        id: '5',
        name: 'Iridium Spark Plug',
        sku: 'S-102',
        category: Category.ENGINE,
        price: 1200,
        description: 'Long-life iridium plug.',
        compatibility: ['Toyota Camry', 'Lexus RX'],
        image: 'https://masuma.com/wp-content/uploads/2021/09/S-102_1.jpg',
        stock: true,
        oemNumbers: ['90919-01210']
    }
];

// Request Interceptor
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

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle Network Error / Offline Mode
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
        console.warn('Backend unreachable. Serving Mock Data.');
        return serveMockData(error.config);
    }

    // Handle Auth Error
    if (error.response?.status === 401 && !error.config.url.includes('/login')) {
        localStorage.removeItem('masuma_auth_token');
        window.location.href = '/'; 
    }
    
    return Promise.reject(error);
  }
);

// --- MOCK HANDLER ---
const serveMockData = (config: InternalAxiosRequestConfig) => {
    const url = config.url || '';
    
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // 1. Products
            if (url.includes('/products')) {
                if (url.includes('sku')) {
                    // Single SKU search
                    resolve({ data: MOCK_PRODUCTS.slice(0, 1), status: 200 });
                } else {
                    // List
                    resolve({ data: { data: MOCK_PRODUCTS, meta: { total: 5, page: 1, limit: 20 } }, status: 200 });
                }
                return;
            }

            // 2. Stats
            if (url.includes('/admin/stats')) {
                resolve({
                    data: {
                        totalSales: 1250000,
                        lowStockItems: 4,
                        todaysOrders: 12,
                        pendingQuotes: 3,
                        monthlyRevenue: [
                            { name: 'Jan', value: 80000 }, { name: 'Feb', value: 95000 },
                            { name: 'Mar', value: 110000 }, { name: 'Apr', value: 105000 },
                            { name: 'May', value: 130000 }, { name: 'Jun', value: 125000 }
                        ],
                        categorySales: [
                            { name: 'Filters', value: 40 }, { name: 'Brakes', value: 35 },
                            { name: 'Suspension', value: 25 }
                        ]
                    },
                    status: 200
                });
                return;
            }

            // 3. Auth
            if (url.includes('/auth/login')) {
                resolve({
                    data: {
                        token: 'mock-token-123',
                        user: { id: '1', name: 'Admin User', email: 'admin@masuma.africa', role: 'ADMIN', branch: { id: '1', name: 'HQ' } }
                    },
                    status: 200
                });
                return;
            }

            // 4. Generic Arrays (Inventory, Sales, Users, etc.)
            if (['/inventory', '/users', '/sales', '/orders', '/quotes', '/customers', '/branches'].some(path => url.includes(path))) {
                resolve({ data: [], status: 200 });
                return;
            }
            
            // 5. Settings
            if (url.includes('/settings')) {
                resolve({ data: {}, status: 200 });
                return;
            }

            // Default 200 OK for POSTs (create/update)
            if (config.method !== 'get') {
                resolve({ data: { message: 'Action simulated (Offline Mode)' }, status: 200 });
                return;
            }
            
            reject(new Error('Mock route not found'));
        }, 500);
    });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
