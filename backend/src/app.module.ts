import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { OrdersModule } from './orders/orders.module';
import { InventoryModule } from './inventory/inventory.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CategoryModule } from './category/category.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';
import { BannersModule } from './banners/banners.module';
import { CouponsModule } from './coupons/coupons.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    AuthModule,
    CatalogModule,
    OrdersModule,
    InventoryModule,
    AnalyticsModule,
    CategoryModule,
    UploadModule,
    UsersModule,
    BannersModule,
    CouponsModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, RedisService],
})
export class AppModule {}
