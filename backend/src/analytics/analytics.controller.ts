import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

// Every analytics route is admin-only. This is the real security boundary —
// the frontend guard is only UX.
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get('overview')
  overview() {
    return this.analytics.getOverview();
  }

  @Get('revenue')
  revenue(@Query('days') days?: string) {
    return this.analytics.getRevenueOverTime(days ? parseInt(days, 10) : 30);
  }

  @Get('top-products')
  topProducts(@Query('limit') limit?: string) {
    return this.analytics.getTopProducts(limit ? parseInt(limit, 10) : 5);
  }

  @Get('orders-by-status')
  ordersByStatus() {
    return this.analytics.getOrdersByStatus();
  }

  @Get('recent-orders')
  recentOrders(@Query('limit') limit?: string) {
    return this.analytics.getRecentOrders(limit ? parseInt(limit, 10) : 8);
  }
}
