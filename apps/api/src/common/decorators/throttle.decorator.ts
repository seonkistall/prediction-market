import { Throttle, SkipThrottle } from '@nestjs/throttler';

// Default rate limits
export const RateLimits = {
  // Auth endpoints - strict limits
  AUTH: { ttl: 60000, limit: 5 }, // 5 requests per minute

  // Public read endpoints - generous limits
  PUBLIC: { ttl: 60000, limit: 100 }, // 100 requests per minute

  // User write operations - moderate limits
  WRITE: { ttl: 60000, limit: 30 }, // 30 requests per minute

  // Betting endpoints - per-user limits
  BETTING: { ttl: 60000, limit: 20 }, // 20 bets per minute

  // Admin endpoints - moderate limits
  ADMIN: { ttl: 60000, limit: 50 }, // 50 requests per minute

  // Price/Market data - high frequency allowed
  MARKET_DATA: { ttl: 60000, limit: 200 }, // 200 requests per minute
} as const;

// Decorator factories
export const ThrottleAuth = () => Throttle({ default: RateLimits.AUTH });
export const ThrottlePublic = () => Throttle({ default: RateLimits.PUBLIC });
export const ThrottleWrite = () => Throttle({ default: RateLimits.WRITE });
export const ThrottleBetting = () => Throttle({ default: RateLimits.BETTING });
export const ThrottleAdmin = () => Throttle({ default: RateLimits.ADMIN });
export const ThrottleMarketData = () => Throttle({ default: RateLimits.MARKET_DATA });

// Re-export SkipThrottle for convenience
export { SkipThrottle };
