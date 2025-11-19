
import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

// Main cache client
export const redis = new Redis(redisConfig);

// Subscriber client for Pub/Sub (if needed later)
export const redisSubscriber = new Redis(redisConfig);

redis.on('error', (err) => console.error('Redis Client Error', err));
redis.on('connect', () => console.log('Redis Client Connected'));
