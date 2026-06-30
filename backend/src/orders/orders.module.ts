import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService, RedisService],
  exports: [OrdersService],
})
export class OrdersModule {}
