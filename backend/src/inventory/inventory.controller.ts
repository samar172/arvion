import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getAllInventory() {
    return this.inventoryService.getAllInventory();
  }

  @Put(':productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateStock(
    @Param('productId') productId: string,
    @Body('stock') stock: number,
  ) {
    return this.inventoryService.updateStock(productId, stock);
  }
}
