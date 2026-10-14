import { Injectable, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { StockService } from '../inventory/stock.service';
import { RedisService } from '../redis.service';
import { CouponsService } from '../coupons/coupons.service';
import { SettingsService } from '../settings/settings.service';
import {
  CheckoutDto,
  ImportOfflineSalesDto,
  OfflineSaleDto,
  OrdersQueryDto,
  VerifyPaymentDto,
} from './dto/orders.dto';
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
    private stock: StockService,
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

        // Admin can hide a product while it still sits in someone's bag.
        if (!product.isActive) {
          throw new BadRequestException(`${product.title} is no longer available`);
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
            channel: 'ONLINE',
            paymentMethod: 'RAZORPAY',
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
        // Already reserved at checkout, so this never blocks a paid order.
        await this.stock.move(tx, {
          productId: item.productId,
          delta: -item.quantity,
          type: 'SALE_ONLINE',
          orderId: order.id,
          releaseReserved: item.quantity,
          allowNegative: true,
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

  async getAllOrders(q: OrdersQueryDto = {}) {
    const where: Prisma.OrderWhereInput = {};
    if (q.channel) where.channel = q.channel;
    if (q.status) where.status = q.status;
    if (q.from || q.to) {
      where.createdAt = {};
      if (q.from) where.createdAt.gte = new Date(q.from);
      if (q.to) where.createdAt.lte = new Date(new Date(q.to).getTime() + 86_399_999);
    }
    return this.prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        user: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }

  async getOrderById(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        user: { select: { name: true, email: true, phone: true } },
      },
    });
  }

  /**
   * Status changes that move goods keep stock honest:
   * - cancelling a PENDING online order releases its reservation;
   * - cancelling a paid or completed order puts the units back (once).
   * A cancelled or failed order is final, so its stock can't be counted twice.
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === status) return order;
    if (order.status === 'CANCELLED' || order.status === 'FAILED') {
      throw new BadRequestException(
        `This order is ${order.status.toLowerCase()}; create a new order instead of reopening it`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (status === 'CANCELLED' || status === 'FAILED') {
        if (order.status === 'PENDING') {
          for (const item of order.items) {
            await tx.inventory.update({
              where: { productId: item.productId },
              data: { reserved: { decrement: item.quantity } },
            });
          }
          await this.redisService.getClient().del(`order:reservation:${order.id}`);
        } else if (!order.restockedAt) {
          for (const item of order.items) {
            await this.stock.move(tx, {
              productId: item.productId,
              delta: item.quantity,
              type: 'RETURN',
              orderId: order.id,
              note: `Order #${order.id.slice(0, 8).toUpperCase()} ${status.toLowerCase()}`,
              userId,
            });
          }
          return tx.order.update({
            where: { id: orderId },
            data: { status, restockedAt: new Date() },
          });
        }
      }
      return tx.order.update({ where: { id: orderId }, data: { status } });
    });
  }

  /** A sale made in the shop: stock leaves immediately and the order is complete. */
  async createOfflineSale(dto: OfflineSaleDto, adminId?: string) {
    return this.prisma.$transaction((tx) => this.writeOfflineSale(tx, dto, adminId));
  }

  private async writeOfflineSale(tx: Prisma.TransactionClient, dto: OfflineSaleDto, adminId?: string) {
    if (!dto.items.length) throw new BadRequestException('Add at least one item');

    const products = await tx.product.findMany({
      where: { id: { in: dto.items.map((i) => i.productId) } },
      select: { id: true, price: true, title: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const lines = dto.items.map((item) => {
      const product = byId.get(item.productId);
      if (!product) throw new BadRequestException(`Product ${item.productId} not found`);
      const price = item.unitPrice ?? Number(product.price);
      subtotal += price * item.quantity;
      return { productId: product.id, quantity: item.quantity, price };
    });

    const discount = Math.min(dto.discountAmount ?? 0, subtotal);
    const total = Math.round((subtotal - discount) * 100) / 100;
    const soldAt = dto.soldAt ? new Date(dto.soldAt) : undefined;

    const order = await tx.order.create({
      data: {
        channel: 'OFFLINE',
        status: 'DELIVERED',
        paymentMethod: dto.paymentMethod ?? 'CASH',
        customerName: dto.customerName?.trim() || 'Walk-in customer',
        customerPhone: dto.customerPhone?.trim() || null,
        note: dto.note?.trim() || null,
        subtotalAmount: subtotal,
        discountAmount: discount,
        totalAmount: total,
        ...(soldAt ? { createdAt: soldAt } : {}),
        items: { create: lines },
      },
      include: { items: { include: { product: true } } },
    });

    for (const line of lines) {
      await this.stock.move(tx, {
        productId: line.productId,
        delta: -line.quantity,
        type: 'SALE_OFFLINE',
        orderId: order.id,
        userId: adminId,
      });
    }

    return order;
  }

  /**
   * Bulk-record shop sales from a spreadsheet. Rows sharing a bill number
   * become one order; rows without one each become their own. `dryRun`
   * validates SKUs and stock (summed per product) without writing.
   */
  async importOfflineSales(dto: ImportOfflineSalesDto, adminId?: string) {
    const skus = [...new Set(dto.rows.map((r) => r.sku?.trim().toLowerCase()).filter(Boolean))];
    const products = await this.prisma.product.findMany({
      where: { sku: { in: skus, mode: 'insensitive' } },
      select: { id: true, sku: true, title: true, price: true, inventory: true },
    });
    const bySku = new Map(products.map((p) => [p.sku.toLowerCase(), p]));
    const needed = new Map<string, number>();

    const rows = dto.rows.map((row, i) => {
      const line = row.line ?? i + 2;
      const product = row.sku ? bySku.get(row.sku.trim().toLowerCase()) : undefined;
      const base = { line, sku: row.sku ?? '', title: product?.title ?? null, bill: row.bill ?? null };
      if (!row.sku) return { ...base, status: 'error' as const, message: 'SKU is missing' };
      if (!product) return { ...base, status: 'error' as const, message: 'No product with this SKU' };
      if (!Number.isInteger(row.quantity) || row.quantity < 1) {
        return { ...base, status: 'error' as const, message: 'Quantity must be a whole number above 0' };
      }
      if (row.date && Number.isNaN(new Date(row.date).getTime())) {
        return { ...base, status: 'error' as const, message: `Can't read date "${row.date}"` };
      }
      needed.set(product.id, (needed.get(product.id) ?? 0) + row.quantity);
      const unitPrice = row.unitPrice ?? Number(product.price);
      return {
        ...base,
        status: 'ok' as const,
        message: null,
        productId: product.id,
        quantity: row.quantity,
        unitPrice,
        amount: unitPrice * row.quantity,
      };
    });

    // Stock is checked per product across the whole sheet, not per row.
    for (const r of rows) {
      if (r.status !== 'ok') continue;
      const product = products.find((p) => p.id === r.productId)!;
      const onHand = (product.inventory?.stock ?? 0) - (product.inventory?.reserved ?? 0);
      const want = needed.get(product.id)!;
      if (want > onHand) {
        Object.assign(r, {
          status: 'error',
          message: `Sheet sells ${want}, only ${onHand} available`,
        });
      }
    }

    const groups = new Map<string, typeof dto.rows>();
    dto.rows.forEach((row, i) => {
      const key = row.bill?.trim() ? `bill:${row.bill.trim()}` : `row:${i}`;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    });

    const errors = rows.filter((r) => r.status === 'error').length;
    const report = {
      errors,
      orders: groups.size,
      units: rows.reduce((n, r) => n + (r.status === 'ok' ? r.quantity : 0), 0),
      revenue: rows.reduce((n, r) => n + (r.status === 'ok' ? r.amount : 0), 0),
      rows,
    };
    if (dto.dryRun) return { ...report, applied: false };
    if (errors) throw new BadRequestException(`${errors} row(s) have errors; fix them and import again`);

    await this.prisma.$transaction(
      async (tx) => {
        for (const group of groups.values()) {
          const first = group[0];
          await this.writeOfflineSale(
            tx,
            {
              items: group.map((r) => ({
                productId: bySku.get(r.sku!.trim().toLowerCase())!.id,
                quantity: r.quantity,
                unitPrice: r.unitPrice,
              })),
              customerName: first.customerName,
              customerPhone: first.customerPhone,
              paymentMethod: first.paymentMethod,
              soldAt: first.date,
              note: first.bill ? `Bill ${first.bill} (imported)` : 'Imported sale',
            },
            adminId,
          );
        }
      },
      { timeout: 120_000 },
    );
    return { ...report, applied: true };
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
