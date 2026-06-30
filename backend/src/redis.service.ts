import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }

  /**
   * Acquire a distributed lock for stock reservation.
   * Prevents race conditions during heavy checkout traffic.
   */
  async acquireLock(key: string, ttl: number = 5000): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const result = await this.client.set(lockKey, 'locked', 'PX', ttl, 'NX');
    return result === 'OK';
  }

  /**
   * Release a distributed lock.
   */
  async releaseLock(key: string): Promise<void> {
    const lockKey = `lock:${key}`;
    await this.client.del(lockKey);
  }
}
