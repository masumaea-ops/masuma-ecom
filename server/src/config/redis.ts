
import Redis from 'ioredis';
import { config } from './env';

let redisClient: Redis | null = null;

// Only attempt connection if Host is defined
if (config.REDIS_HOST) {
    const options = {
        host: config.REDIS_HOST,
        port: Number(config.REDIS_PORT) || 6379,
        password: config.REDIS_PASSWORD,
        family: 4, // Force IPv4
        maxRetriesPerRequest: null, // Required for BullMQ
        retryStrategy: (times: number) => {
            // If it fails more than 3 times, stop retrying and go offline mode
            if (times > 3) {
                console.warn('⚠️ Redis connection failed too many times. Disabling Redis features.');
                redisClient = null;
                return null;
            }
            return Math.min(times * 50, 2000);
        }
    };

    try {
        const client = new Redis(options);
        
        client.on('connect', () => {
            console.log('✅ Redis Client Connected');
        });

        client.on('error', (err) => {
            // Suppress verbose logs after initial failure
            // console.warn('Redis Error (Running in fallback mode):', err.message);
        });

        redisClient = client;
    } catch (error) {
        console.warn('⚠️ Failed to initialize Redis. Caching and Queues disabled.');
        redisClient = null;
    }
} else {
    console.log('ℹ️ REDIS_HOST not set. Running in Memory-Only mode.');
}

export const redis = redisClient;
