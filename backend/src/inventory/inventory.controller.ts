import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  AdjustStockDto,
  ImportStockDto,
  InventoryQueryDto,
  MovementsQueryDto,
} from './dto/inventory.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  list(@Query() q: InventoryQueryDto) {
    return this.inventoryService.list(q);
  }

  @Get('movements')
  movements(@Query() q: MovementsQueryDto) {
    return this.inventoryService.movements(q);
  }

  @Post('import')
  importStock(@Body() dto: ImportStockDto, @Req() req: any) {
    return this.inventoryService.importStock(dto, req.user?.id);
  }

  @Post(':productId/adjust')
  adjust(@Param('productId') productId: string, @Body() dto: AdjustStockDto, @Req() req: any) {
    return this.inventoryService.adjust(productId, dto, req.user?.id);
  }

  /** Kept for older admin builds: sets stock to an exact count. */
  @Put(':productId')
  setStock(@Param('productId') productId: string, @Body('stock') stock: number, @Req() req: any) {
    return this.inventoryService.adjust(
      productId,
      { mode: 'set', quantity: Number(stock), reason: 'ADJUSTMENT' },
      req.user?.id,
    );
  }
}
