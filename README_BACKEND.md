# Masuma Autoparts Backend (TypeORM)

This folder contains a production-grade backend architecture designed for high performance and SEO, featuring **M-Pesa Integration** and **TypeORM**.

## Prerequisites
1. **Node.js** (v18+)
2. **MySQL Database** (Local or Cloud, e.g., AWS RDS)
3. **Redis** (Local or Cloud, e.g., AWS ElastiCache)
4. **Safaricom Daraja Account** (Sandbox or Production)

## Setup Steps

1. **Install Dependencies**
   ```bash
   cd server
   # Remove Prisma
   npm uninstall @prisma/client prisma
   
   # Install TypeORM & Drivers
   npm install express typeorm mysql2 reflect-metadata ioredis bullmq cors helmet compression zod axios
   npm install --save-dev typescript @types/node @types/express ts-node
   ```

2. **Environment Variables**
   Update `.env` in the `server` directory:
   ```env
   # DB Config
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=password
   DB_NAME=masuma_db
   
   REDIS_HOST="localhost"
   REDIS_PORT="6379"
   FRONTEND_URL="http://localhost:5173"

   # M-Pesa Config
   MPESA_ENV="sandbox" # or "production"
   MPESA_CONSUMER_KEY="your_daraja_key"
   MPESA_CONSUMER_SECRET="your_daraja_secret"
   MPESA_PASSKEY="your_daraja_passkey"
   MPESA_SHORTCODE="174379" # Sandbox Paybill
   MPESA_CALLBACK_URL="https://your-ngrok-url.ngrok-free.app/api/mpesa/callback"
   ```

3. **Sync Database**
   The app is configured to `synchronize: true` in development, which will auto-create tables.
   For production, set `synchronize: false` in `src/config/database.ts` and use `typeorm-cli` for migrations.

4. **Run Server**
   ```bash
   npx ts-node src/app.ts
   ```

5. **Run Workers**
   ```bash
   npx ts-node src/workers/emailWorker.ts
   ```
