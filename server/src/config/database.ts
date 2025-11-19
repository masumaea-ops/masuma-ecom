import { DataSource } from 'typeorm';
import { Product } from '../entities/Product';
import { Category } from '../entities/Category';
import { Vehicle } from '../entities/Vehicle';
import { OemNumber } from '../entities/OemNumber';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { MpesaTransaction } from '../entities/MpesaTransaction';

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
    MpesaTransaction
  ],
  subscribers: [],
  migrations: [],
  // Connection pool settings for enterprise scale
  extra: {
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
  }
});
