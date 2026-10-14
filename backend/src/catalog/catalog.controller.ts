import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import {
  BulkProductsDto,
  CreateProductDto,
  ImportProductsDto,
  UpdateProductDto,
  SearchProductsDto,
} from './dto/catalog.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  @Get()
  search(@Query() query: SearchProductsDto) {
    return this.catalogService.search(query);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  importProducts(@Body() dto: ImportProductsDto, @Req() req: any) {
    return this.catalogService.importProducts(dto, req.user?.id);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  bulk(@Body() dto: BulkProductsDto) {
    return this.catalogService.bulk(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.catalogService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateProductDto) {
    return this.catalogService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.catalogService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.catalogService.remove(id);
  }
}
