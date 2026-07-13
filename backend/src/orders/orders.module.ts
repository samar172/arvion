import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';
import { CouponsModule } from '../coupons/coupons.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [CouponsModule, SettingsModule],
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService, RedisService],
  exports: [OrdersService],
})
export class OrdersModule {}
