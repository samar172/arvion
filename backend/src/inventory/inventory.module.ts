import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { StockService } from './stock.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, StockService, PrismaService],
  exports: [StockService],
})
export class InventoryModule {}
