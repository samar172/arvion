import { Controller, Post, Get, Put, Param, Body, Req, Headers, UseGuards, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/orders.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  checkout(@Req() req: any, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(req.user.id, dto);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  getMyOrders(@Req() req: any) {
    return this.ordersService.getMyOrders(req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateOrderStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.ordersService.updateOrderStatus(id, status);
  }

  @Post('webhook')
  handleWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: any,
  ) {
    if (!signature) {
      throw new BadRequestException('Signature missing');
    }
    return this.ordersService.handleWebhook(body, signature);
  }
}
