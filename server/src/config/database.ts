import { DataSource } from 'typeorm';
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

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'masuma_db',
  synchronize: process.env.NODE_ENV !== 'production', // Set to false in production and use migrations
  logging: process.env.NODE_ENV === 'development',
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
    Sale
  ],
  subscribers: [],
  migrations: [],
  extra: {
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
  }
});