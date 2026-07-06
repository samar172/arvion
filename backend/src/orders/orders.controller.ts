import { Controller, Post, Get, Put, Param, Body, Req, Headers, UseGuards, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutDto, VerifyPaymentDto } from './dto/orders.dto';
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

  @Post('verify-payment')
  @UseGuards(JwtAuthGuard)
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.ordersService.verifyPayment(dto);
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
    @Req() req: any,
  ) {
    if (!signature) {
      throw new BadRequestException('Signature missing');
    }
    // req.rawBody is populated because the app is created with { rawBody: true }.
    // Razorpay signs the exact bytes it POSTed, so we must verify against those.
    const raw: Buffer = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
    return this.ordersService.handleWebhook(raw, signature);
  }
}
