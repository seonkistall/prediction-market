import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { RedisService } from '../../../common/redis/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const isConnected = await this.redisService.ping();
      const isHealthy = isConnected;

      const result = this.getStatus(key, isHealthy, {
        type: this.redisService.isUsingMemoryCache() ? 'memory' : 'redis',
      });

      if (isHealthy) {
        return result;
      }

      throw new HealthCheckError('Redis check failed', result);
    } catch (error) {
      const result = this.getStatus(key, false, {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new HealthCheckError('Redis check failed', result);
    }
  }
}
