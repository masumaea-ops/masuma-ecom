
import { redis } from '../config/redis';

const DEFAULT_TTL = 3600; // 1 hour in seconds

export class CacheService {
  /**
   * Cache-Aside Pattern Implementation
   * 1. Check Cache
   * 2. If Miss, execute 'fetcher' function (DB query)
   * 3. Store result in Cache
   * 4. Return result
   */
  static async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl: number = DEFAULT_TTL): Promise<T> {
    try {
      // 1. Try get from cache
      const cachedData = await redis.get(key);
      if (cachedData) {
        // console.log(`Cache Hit: ${key}`);
        return JSON.parse(cachedData) as T;
      }

      // 2. Cache Miss - Fetch from DB
      // console.log(`Cache Miss: ${key}`);
      const freshData = await fetcher();

      // 3. Set to cache (if data exists)
      if (freshData) {
        await redis.set(key, JSON.stringify(freshData), 'EX', ttl);
      }

      return freshData;
    } catch (error) {
      console.error(`Cache Error for key ${key}:`, error);
      // Fallback: If redis fails, just return the DB result directly
      return fetcher();
    }
  }

  static async invalidate(pattern: string): Promise<void> {
    const stream = redis.scanStream({ match: pattern });
    stream.on('data', (keys) => {
      if (keys.length) {
        const pipeline = redis.pipeline();
        keys.forEach((key: string) => pipeline.del(key));
        pipeline.exec();
      }
    });
  }
}
