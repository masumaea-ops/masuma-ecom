
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import path from 'path';
import { Product } from '../entities/Product';
import { Category } from '../entities/Category';
import { Vehicle } from '../entities/Vehicle';
import { OemNumber } from '../entities/OemNumber';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { MpesaTransaction } from '../entities/MpesaTransaction';
import { Branch } from '../entities/Branch';
import { User } from '../entities/User';
import { Customer } from '../entities/Customer';
import { ProductStock } from '../entities/ProductStock';
import { Quote } from '../entities/Quote';
import { Sale } from '../entities/Sale';
import { BlogPost } from '../entities/BlogPost';
import { AuditLog } from '../entities/AuditLog';
import { SystemSetting } from '../entities/SystemSetting';
import { Payment } from '../entities/Payment';
import { Expense } from '../entities/Expense';

// Load .env explicitly from the server root directory
const envPath = path.resolve((process as any).cwd(), '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn(`⚠️  .env file not found at: ${envPath}`);
    console.warn('   Using default credentials (password: "password")');
} else {
    console.log(`✅ Loaded configuration from: ${envPath}`);
}

// Log connection details (masking password for security if not empty)
const dbUser = process.env.DB_USER || 'root';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 3306;
const dbName = process.env.DB_NAME || 'masuma_db';
console.log(`🔌 Connecting to Database: ${dbUser}@${dbHost}:${dbPort}/${dbName}`);

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  // Use ?? 'password' to allow empty string passwords (common in XAMPP)
  password: process.env.DB_PASSWORD ?? 'password',
  database: process.env.DB_NAME || 'masuma_db',
  synchronize: process.env.NODE_ENV !== 'production', // Set to false in production and use migrations
  logging: false, // Disable verbose SQL logs during seed/start
  entities: [
    Product,
    Category,
    Vehicle,
    OemNumber,
    Order,
    OrderItem,
    MpesaTransaction,
    Branch,
    User,
    Customer,
    ProductStock,
    Quote,
    Sale,
    BlogPost,
    AuditLog,
    SystemSetting,
    Payment,
    Expense
  ],
  subscribers: [],
  migrations: [],
  extra: {
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true, // Critical: Prevents "Connection lost" errors
    keepAliveInitialDelay: 10000 // Send ping every 10 seconds to keep connection active
  }
});
