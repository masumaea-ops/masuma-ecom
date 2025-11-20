
export enum Category {
  ALL = 'All',
  FILTERS = 'Filters',
  BRAKES = 'Brakes',
  SUSPENSION = 'Suspension',
  ENGINE = 'Engine & Ignition',
  WIPERS = 'Wiper Blades',
  CHASSIS = 'Chassis',
  COOLING = 'Cooling System',
  BELTS = 'Drive Belts',
  FASTENERS = 'Clips & Bolts'
}

export interface Product {
  id: string;
  name: string;
  sku: string; // Masuma Part Number
  oemNumbers: string[]; // Original Equipment Manufacturer Numbers
  category: Category;
  price: number; // In KES
  wholesalePrice?: number;
  description: string;
  compatibility: string[]; // e.g., ["Toyota Vitz", "Corolla"]
  image: string;
  images?: string[];
  videoUrl?: string;
  stock: boolean; // Frontend derived flag
}

export interface CartItem extends Product {
  quantity: number;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string; // HTML or Markdown-like string
  image: string;
  date: string;
  readTime: string;
  category: string;
  relatedProductCategory: Category; // To link products to articles
}

export type ViewState = 'HOME' | 'CATALOG' | 'PART_FINDER' | 'ABOUT' | 'CONTACT' | 'BLOG' | 'LOGIN' | 'DASHBOARD';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

// --- Admin / Dashboard Types ---

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'B2B_USER';
  branchId?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
}

export interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    date: string;
    total: number;
    status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED';
    paymentMethod: string;
    items: { name: string; qty: number }[];
}

export interface Sale {
    id: string;
    receiptNumber: string;
    date: string;
    totalAmount: number;
    paymentMethod: string;
    cashierName: string;
    customerName?: string;
    kraControlCode?: string;
    itemsCount: number;
    itemsSnapshot?: any[];
}

export interface MpesaLog {
    id: string;
    checkoutRequestID: string;
    phoneNumber: string;
    amount: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    mpesaReceiptNumber?: string;
    resultDesc?: string;
    date: string;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    kraPin?: string;
    isWholesale: boolean;
    totalSpend: number;
    lastVisit: string;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  mediaType?: 'image' | 'video' | 'youtube';
  videoUrl?: string;
  ctaText: string;
  ctaLink: ViewState;
}

export interface CmsConfig {
    heroTitle: string; // Legacy
    heroSubtitle: string; // Legacy
    heroImage: string; // Legacy
    announcementText: string;
    showAnnouncement: boolean;
}

export interface DashboardStats {
  totalSales: number;
  lowStockItems: number;
  todaysOrders: number;
  pendingQuotes: number;
  monthlyRevenue: { name: string; value: number }[];
  categorySales: { name: string; value: number }[];
}

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED'
}

export interface Quote {
    id: string;
    quoteNumber: string;
    customerName: string;
    date: string;
    total: number;
    status: QuoteStatus;
    items: { productId: string; name: string; quantity: number; unitPrice: number; total: number }[];
}
