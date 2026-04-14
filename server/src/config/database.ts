import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import { config } from './env'; 

// Fix for __dirname in Node.js environment with TypeScript
declare const __dirname: string;

// We use a glob pattern for entities to ensure all entities are correctly 
// discovered and registered in both development (TS) and production (JS)
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: config.DB_HOST,
  port: Number(config.DB_PORT) || 3306,
  username: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  synchronize: config.NODE_ENV === 'development', // Only sync in dev to prevent production locks
  logging: false, 
  entities: [
    path.join(__dirname, '../entities/**/*.{ts,js}')
  ],
  subscribers: [],
  migrations: [],
  extra: {
    connectionLimit: 50, // Increased from 10 to support multiple subdomains
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true, 
    keepAliveInitialDelay: 10000 
  }
});