import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis | null;
  private readonly isEnabled: boolean;

  // Default TTLs
  static readonly TTL_SHORT = 5; // 5 seconds for price data
  static readonly TTL_MEDIUM = 30; // 30 seconds for market list
  static readonly TTL_LONG = 300; // 5 minutes for static data

  constructor(private readonly configService: ConfigService) {
    const redisHost = this.configService.get<string>('REDIS_HOST');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);

    if (redisHost) {
      this.redis = new Redis({
        host: redisHost,
        port: redisPort,
        password: this.configService.get<string>('REDIS_PASSWORD'),
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis connection failed, falling back to memory cache');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.logger.log('Connected to Redis');
      });

      this.redis.on('error', (err) => {
        this.logger.error('Redis error', err.message);
      });

      this.isEnabled = true;

      // Connect asynchronously
      this.redis.connect().catch(() => {
        this.logger.warn('Redis connection failed, using memory fallback');
      });
    } else {
      this.redis = null;
      this.isEnabled = false;
      this.logger.log('Redis not configured, using memory cache');
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  // Memory fallback cache
  private memoryCache = new Map<string, { value: string; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redis && this.redis.status === 'ready') {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
      }

      // Memory fallback
      const cached = this.memoryCache.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        return JSON.parse(cached.value);
      }
      return null;
    } catch (error) {
      this.logger.error(`Redis GET error for key ${key}`, error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number = RedisService.TTL_MEDIUM): Promise<void> {
    const serialized = JSON.stringify(value);

    try {
      if (this.redis && this.redis.status === 'ready') {
        await this.redis.setex(key, ttlSeconds, serialized);
        return;
      }

      // Memory fallback
      this.memoryCache.set(key, {
        value: serialized,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });

      // Clean up expired entries occasionally
      if (this.memoryCache.size > 1000) {
        this.cleanupMemoryCache();
      }
    } catch (error) {
      this.logger.error(`Redis SET error for key ${key}`, error);
      // Fallback to memory
      this.memoryCache.set(key, {
        value: serialized,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.redis && this.redis.status === 'ready') {
        await this.redis.del(key);
      }
      this.memoryCache.delete(key);
    } catch (error) {
      this.logger.error(`Redis DEL error for key ${key}`, error);
      this.memoryCache.delete(key);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      if (this.redis && this.redis.status === 'ready') {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      // Memory fallback - clear matching keys
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      this.logger.error(`Redis DEL pattern error for ${pattern}`, error);
    }
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  async ping(): Promise<boolean> {
    try {
      if (this.redis && this.redis.status === 'ready') {
        const result = await this.redis.ping();
        return result === 'PONG';
      }
      // Memory cache is always available
      return true;
    } catch {
      return false;
    }
  }

  isUsingMemoryCache(): boolean {
    return !this.redis || this.redis.status !== 'ready';
  }

  // Cache key generators
  static keys = {
    markets: () => 'markets:list',
    market: (symbol: string) => `market:${symbol}`,
    price: (symbol: string) => `price:${symbol}`,
    round: (marketId: string) => `round:current:${marketId}`,
    roundById: (roundId: string) => `round:${roundId}`,
  };
}
