import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';
import { CheckoutDto } from './dto/orders.dto';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService implements OnModuleInit {
  private razorpay: any;

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  onModuleInit() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'mock-key-id',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock-key-secret',
    });
  }

  async checkout(userId: string, dto: CheckoutDto) {
    const lockKeys = dto.items.map((item) => `product:${item.productId}`);
    
    // 1. Acquire locks for all items
    for (const key of lockKeys) {
      const acquired = await this.redisService.acquireLock(key, 5000);
      if (!acquired) {
        throw new BadRequestException('Checkout system busy, please try again');
      }
    }

    try {
      let totalAmount = 0;
      const orderItemsData = [];

      // 2. Validate stock and compute prices
      for (const item of dto.items) {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          include: { inventory: true },
        });

        if (!product || !product.inventory) {
          throw new BadRequestException(`Product ${item.productId} not found`);
        }

        const availableStock = product.inventory.stock - product.inventory.reserved;
        if (availableStock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${product.title}`);
        }

        totalAmount += Number(product.price) * item.quantity;
        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        });
      }

      // 3. Create Pending Order & Increment Reserved Stock in a Transaction
      const order = await this.prisma.$transaction(async (tx) => {
        // Reserve stock
        for (const item of dto.items) {
          await tx.inventory.update({
            where: { productId: item.productId },
            data: { reserved: { increment: item.quantity } },
          });
        }

        // Create Order record
        return tx.order.create({
          data: {
            userId,
            totalAmount,
            status: 'PENDING',
            items: {
              create: orderItemsData.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
          include: { items: true },
        });
      });

      // 4. Create Razorpay Order
      let razorpayOrder;
      try {
        razorpayOrder = await this.razorpay.orders.create({
          amount: Math.round(totalAmount * 100), // Amount in paise
          currency: 'INR',
          receipt: order.id,
        });
      } catch (err) {
        // Rollback reservation on Razorpay failure
        await this.rollbackReservation(order.id);
        throw new BadRequestException('Failed to initialize payment gateway');
      }

      // Update Order with Razorpay ID
      await this.prisma.order.update({
        where: { id: order.id },
        data: { razorpayOrderId: razorpayOrder.id },
      });

      // 5. Set Reservation Timeout in Redis (15 Minutes)
      const redis = this.redisService.getClient();
      await redis.set(`order:reservation:${order.id}`, 'reserved', 'EX', 900);

      // Launch async timer callback to release reservations if unpaid
      this.scheduleRollbackTimeout(order.id, 900 * 1000);

      return {
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID || 'mock-key-id',
      };
    } finally {
      // 6. Release locks
      for (const key of lockKeys) {
        await this.redisService.releaseLock(key);
      }
    }
  }

  async handleWebhook(body: any, signature: string) {
    // 1. Signature validation
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock-webhook-secret';
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(body));
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = body.event;
    const payload = body.payload;

    if (event === 'order.paid') {
      const razorpayOrderId = payload.payment.entity.order_id;
      const razorpayPaymentId = payload.payment.entity.id;
      
      const order = await this.prisma.order.findUnique({
        where: { razorpayOrderId },
        include: { items: true },
      });

      if (order && order.status === 'PENDING') {
        await this.prisma.$transaction(async (tx) => {
          // Confirm payment
          await tx.payment.create({
            data: {
              orderId: order.id,
              razorpayPaymentId,
              razorpaySignature: signature,
              amount: order.totalAmount,
              status: 'COMPLETED',
            },
          });

          // Confirm Order
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'CONFIRMED' },
          });

          // Deduct stock, decrement reserved
          for (const item of order.items) {
            await tx.inventory.update({
              where: { productId: item.productId },
              data: {
                stock: { decrement: item.quantity },
                reserved: { decrement: item.quantity },
              },
            });
          }
        });

        // Clear Redis Reservation Key
        const redis = this.redisService.getClient();
        await redis.del(`order:reservation:${order.id}`);
      }
    }

    return { received: true };
  }

  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      include: { 
        items: { include: { product: true } },
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(orderId: string, status: any) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  private scheduleRollbackTimeout(orderId: string, delayMs: number) {
    setTimeout(async () => {
      const redis = this.redisService.getClient();
      const isActive = await redis.get(`order:reservation:${orderId}`);
      if (isActive) {
        await this.rollbackReservation(orderId);
      }
    }, delayMs);
  }

  private async rollbackReservation(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (order && order.status === 'PENDING') {
      await this.prisma.$transaction(async (tx) => {
        // Rollback reserved stock
        for (const item of order.items) {
          await tx.inventory.update({
            where: { productId: item.productId },
            data: { reserved: { decrement: item.quantity } },
          });
        }

        // Set status to failed
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'FAILED' },
        });
      });

      const redis = this.redisService.getClient();
      await redis.del(`order:reservation:${orderId}`);
    }
  }
}
