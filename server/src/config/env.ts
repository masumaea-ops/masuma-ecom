
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env from root
dotenv.config({ path: path.resolve((process as any).cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  
  // Database
  DB_HOST: z.string().min(1),
  DB_PORT: z.string().default('3306'),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().min(1),

  // Redis (Optional)
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Security
  JWT_SECRET: z.string().min(10),
  CORS_ORIGIN: z.string().default('*'),

  // M-Pesa
  MPESA_CONSUMER_KEY: z.string().optional(),
  MPESA_CONSUMER_SECRET: z.string().optional(),
  MPESA_PASSKEY: z.string().optional(),
  MPESA_SHORTCODE: z.string().optional(),
  MPESA_CALLBACK_URL: z.string().optional(),

  // SMTP (Email)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().default('noreply@masuma.africa'),

  // External API Keys
  GEMINI_API_KEY: z.string().optional(),
  VIN_API_KEY: z.string().optional(),
  EXCHANGE_RATE_API_KEY: z.string().optional(), // New: For reliable currency conversion
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Invalid environment variables');
}

// Export strongly typed config
export const config = parsedEnv.data;
