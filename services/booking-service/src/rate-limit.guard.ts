import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection.remoteAddress || '127.0.0.1';
    const key = `ratelimit:${request.path}:${ip}`;

    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, 60); // 1 minute window
    }

    if (current > 30) {
      throw new HttpException('Too Many Requests. Rate limit exceeded.', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
