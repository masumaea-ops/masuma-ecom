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
  sku: string;
  oemNumbers: string[];
  category: string; 
  price: number; 
  wholesalePrice?: number;
  costPrice?: number;
  description: string;
  compatibility: string[]; 
  image: string;
  images?: string[];
  videoUrl?: string;
  stock: boolean; 
  quantity?: number;
  specs?: Record<string, string | number>;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface PromoCode {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  currentUsage: number;
  isActive: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string; 
  image: string;
  date: string;
  readTime: string;
  category: string;
  relatedProductCategory: string; 
}

export type ViewState = 'HOME' | 'CATALOG' | 'PART_FINDER' | 'ABOUT' | 'CONTACT' | 'BLOG' | 'LOGIN' | 'DASHBOARD' | 'WARRANTY' | 'RESET_PASSWORD' | 'PRIVACY' | 'TERMS' | 'COOKIES' | 'CHECKOUT' | 'MARKETPLACE' | 'IMPORT_CALCULATOR';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'B2B_USER' | 'DEALER' | 'INDIVIDUAL_SELLER';
  branchId?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
}

export interface Payment {
    id: string;
    date: string;
    amount: number;
    method: string;
    reference?: string;
    notes?: string;
}

export interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    shippingAddress?: string;
    date: string;
    total: number;
    amountPaid: number;
    balance: number;
    status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    paymentMethod: string;
    items: { name: string; qty: number; price: number; sku?: string }[];
    payments?: Payment[];
    promoCodeUsed?: string;
    discountAmount?: number;
}

export interface Sale {
    id: string;
    receiptNumber: string;
    date: string;
    createdAt?: string;
    totalAmount: number;
    paymentMethod: string;
    cashierName: string;
    customerName?: string;
    kraControlCode?: string;
    itemsCount: number;
    itemsSnapshot?: any[];
    discount?: number;
    discountType?: 'PERCENTAGE' | 'FIXED';
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
  EXPIRED = 'EXPIRED',
  CONVERTED = 'CONVERTED'
}

export interface Quote {
    id: string;
    quoteNumber: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    date: string;
    total: number;
    status: QuoteStatus;
    type: 'STANDARD' | 'SOURCING';
    vin?: string;
    itemsCount?: number;
    items: { productId: string; name: string; quantity: number; unitPrice: number; total: number }[];
}

// Fix for components/admin/GradingSystem.tsx import errors
export interface Student {
  id: string;
  fullName: string;
  studentId: string;
  currentAverage?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface GradeScale {
  id: string;
  minScore: number;
  maxScore: number;
  label: string;
  comment: string;
}

export interface Assessment {
  id: string;
  studentId: string;
  title: string;
  score: number;
  date: string;
}

export enum ListingStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED'
}

export enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE'
}

export interface VehicleListing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  engineSize?: number;
  bodyType?: string;
  color?: string;
  images?: string[];
  description?: string;
  vehicleType: 'CAR' | 'MOTORCYCLE';
  seller: User;
  status: 'PENDING' | 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'REJECTED';
  isPaid: boolean;
  location?: string;
  vin?: string;
  scanReportUrl?: string;
  auctionSheetUrl?: string;
  isImported: boolean;
  createdAt: string;
}

export interface CrspData {
  id: string;
  make: string;
  model: string;
  year: number;
  crspValue: number;
  engineSize?: number;
  fuelType?: string;
  category?: string;
  transmission?: string;
}

export interface ImportCalculationResult {
  cif: number;
  importDuty: number;
  exciseDuty: number;
  vat: number;
  idf: number;
  rdl: number;
  totalTaxes: number;
  totalCost: number;
  breakdown: {
    age: number;
    depreciationRate: number;
    importDutyRate: number;
    exciseDutyRate: number;
    vatRate: number;
  };
}

export enum FraudReportReason {
  SCAM = 'SCAM',
  FAKE_MILEAGE = 'FAKE_MILEAGE',
  STOLEN_VEHICLE = 'STOLEN_VEHICLE',
  MISLEADING_DESCRIPTION = 'MISLEADING_DESCRIPTION',
  DEPOSIT_SCAM = 'DEPOSIT_SCAM',
  OTHER = 'OTHER'
}

export interface FraudReport {
  id: string;
  listingId?: string;
  listing?: VehicleListing;
  reporterId: string;
  reporter?: User;
  reason: 'SCAM' | 'FAKE_MILEAGE' | 'STOLEN_VEHICLE' | 'MISLEADING_DESCRIPTION' | 'DEPOSIT_SCAM' | 'OTHER';
  description: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  adminNotes?: string;
  createdAt: string;
}

export interface ImportRequest {
  id: string;
  userId: string;
  user?: User;
  make: string;
  model: string;
  minYear: number;
  colorPreference?: string;
  maxMileage?: number;
  budgetKes: number;
  sourceCountry: string;
  additionalNotes?: string;
  status: 'PENDING' | 'SOURCING' | 'QUOTED' | 'DEPOSIT_PAID' | 'SHIPPED' | 'CLEARING' | 'COMPLETED' | 'CANCELLED';
  adminResponse?: any;
  createdAt: string;
  updatedAt: string;
}
