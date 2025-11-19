
# Masuma Autoparts Backend

This folder contains a production-grade backend architecture designed for high performance and SEO.

## Prerequisites
1. **Node.js** (v18+)
2. **MySQL Database** (Local or Cloud, e.g., AWS RDS)
3. **Redis** (Local or Cloud, e.g., AWS ElastiCache)

## Setup Steps

1. **Install Dependencies**
   ```bash
   cd server
   npm install express @prisma/client ioredis bullmq cors helmet compression zod
   npm install --save-dev prisma typescript @types/node @types/express
   ```

2. **Environment Variables**
   Create a `.env` file in the `server` directory:
   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/masuma_db"
   REDIS_HOST="localhost"
   REDIS_PORT="6379"
   FRONTEND_URL="http://localhost:5173"
   ```

3. **Database Migration**
   Push the schema to your MySQL database:
   ```bash
   npx prisma db push
   ```

4. **Run Server**
   ```bash
   npx ts-node src/app.ts
   ```

5. **Run Workers**
   In a separate terminal, run the background worker for emails:
   ```bash
   npx ts-node src/workers/emailWorker.ts
   ```

## Architecture Highlights

- **Cache-Aside Pattern**: See `src/lib/cache.ts`. We check Redis before hitting MySQL.
- **Async Queues**: Order emails are handled by `BullMQ` so the API remains fast.
- **Sitemap**: `/sitemap.xml` is dynamically generated for SEO.
- **Security**: Rate limiting and Zod validation are implemented.
