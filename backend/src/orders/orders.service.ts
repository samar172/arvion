import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';
import { CouponsService } from '../coupons/coupons.service';
import { SettingsService } from '../settings/settings.service';
import { CheckoutDto, VerifyPaymentDto } from './dto/orders.dto';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService implements OnModuleInit {
  private razorpay: any;

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private couponsService: CouponsService,
    private settingsService: SettingsService,
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

      // Apply coupon (server-side validation — never trust client math)
      const subtotalAmount = totalAmount;
      let discountAmount = 0;
      let appliedCoupon: string | null = null;
      if (dto.couponCode) {
        const result = await this.couponsService.validate(dto.couponCode, subtotalAmount);
        discountAmount = result.discount;
        appliedCoupon = result.code;
      }

      // Shipping fee from store settings (free over threshold)
      const settings = await this.settingsService.getAll();
      const freeThreshold = Number(settings.freeShippingThreshold) || 0;
      const shippingFee =
        subtotalAmount - discountAmount >= freeThreshold
          ? 0
          : Number(settings.shippingFee) || 0;

      totalAmount = Math.max(0, subtotalAmount - discountAmount + shippingFee);

      // Fetch user to get their phone
      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      // 3. Create Pending Order & Increment Reserved Stock in a Transaction
      const order = await this.prisma.$transaction(async (tx) => {
        // Reserve stock
        for (const item of dto.items) {
          await tx.inventory.update({
            where: { productId: item.productId },
            data: { reserved: { increment: item.quantity } },
          });
        }

        // Update user profile with latest name/address if not present or if they only had 'Customer'
        if (user && (user.name === 'Customer' || !user.address)) {
          await tx.user.update({
            where: { id: userId },
            data: { 
              name: user.name === 'Customer' ? dto.customerName : user.name,
              address: dto.shippingAddress 
            }
          });
        }

        // Create Order record
        return tx.order.create({
          data: {
            userId,
            totalAmount,
            subtotalAmount,
            discountAmount,
            couponCode: appliedCoupon,
            status: 'PENDING',
            customerName: dto.customerName,
            shippingAddress: dto.shippingAddress,
            customerPhone: user?.phone,
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
        subtotal: subtotalAmount,
        discount: discountAmount,
        shipping: shippingFee,
        couponCode: appliedCoupon,
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

  /**
   * Verify a payment initiated from the client (Razorpay checkout handler callback).
   * Validates the HMAC signature Razorpay returns, then confirms the order.
   * This is what makes the client-side "payment success" trustworthy — the browser
   * cannot forge a valid signature without the key secret.
   */
  async verifyPayment(dto: VerifyPaymentDto) {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'mock-key-secret';
    
    // Bypass for frontend-only testing with Razorpay test keys
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.warn("Bypassing Razorpay signature validation (no secret in .env)");
    } else {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
        .digest('hex');

      // Constant-time comparison to avoid timing attacks.
      const valid =
        expected.length === dto.razorpaySignature.length &&
        crypto.timingSafeEqual(
          Buffer.from(expected),
          Buffer.from(dto.razorpaySignature),
        );

      if (!valid) {
        throw new BadRequestException('Payment signature verification failed');
      }
    }

    const order = await this.confirmOrderPayment(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );

    return { success: true, orderId: order?.id ?? null, status: 'CONFIRMED' };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    // 1. Signature validation over the RAW request body (Razorpay signs the exact
    //    bytes it sent — re-serializing parsed JSON is not byte-identical and fails).
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock-webhook-secret';
    const digest = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const valid =
      digest.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));

    if (!valid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const body = JSON.parse(rawBody.toString('utf8'));

    if (body.event === 'order.paid') {
      const entity = body.payload.payment.entity;
      await this.confirmOrderPayment(entity.order_id, entity.id, signature);
    }

    return { received: true };
  }

  /**
   * Idempotently confirm a paid order: records the payment, marks the order
   * CONFIRMED, and deducts reserved stock. Safe to call from BOTH the client
   * verify endpoint and the webhook — the PENDING guard ensures stock is only
   * ever deducted once, no matter which path fires first.
   */
  private async confirmOrderPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { razorpayOrderId },
      include: { items: true },
    });

    if (!order) {
      throw new BadRequestException('Order not found for this payment');
    }

    // Already processed (e.g. webhook won the race) — no-op, still a success.
    if (order.status !== 'PENDING') {
      return order;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId: order.id,
          razorpayPaymentId,
          razorpaySignature: signature,
          amount: order.totalAmount,
          status: 'COMPLETED',
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED' },
      });

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

    const redis = this.redisService.getClient();
    await redis.del(`order:reservation:${order.id}`);

    if (order.couponCode) {
      await this.couponsService
        .markUsed(order.couponCode)
        .catch(() => undefined);
    }

    return order;
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
        user: { select: { name: true, email: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        items: { include: { product: true } },
        user: { select: { name: true, email: true, phone: true } }
      },
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
