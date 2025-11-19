
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
  description: string;
  compatibility: string[]; // e.g., ["Toyota Vitz", "Corolla"]
  image: string;
  stock: boolean;
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

export type ViewState = 'HOME' | 'CATALOG' | 'ABOUT' | 'CONTACT' | 'BLOG';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}
