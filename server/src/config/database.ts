
import { DataSource } from 'typeorm';
import { config } from './env'; // Import validates env vars first
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

console.log(`🔌 Connecting to Database: ${config.DB_USER}@${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`);

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: config.DB_HOST,
  port: Number(config.DB_PORT),
  username: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  synchronize: config.NODE_ENV !== 'production', // Only sync in dev, use migrations in prod ideally
  logging: false, 
  entities: [
    Product, Category, Vehicle, OemNumber, Order, OrderItem,
    MpesaTransaction, Branch, User, Customer, ProductStock,
    Quote, Sale, BlogPost, AuditLog, SystemSetting, Payment, Expense
  ],
  subscribers: [],
  migrations: [],
  extra: {
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    // Critical for preventing "PROTOCOL_CONNECTION_LOST" in PM2 environments
    enableKeepAlive: true, 
    keepAliveInitialDelay: 10000 
  }
});
