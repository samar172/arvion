import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// Orders in these states represent real, paid revenue.
const PAID_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
// Orders still moving through fulfillment (not yet delivered / cancelled).
const ACTIVE_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED'];

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /** Top-line KPIs for the dashboard cards, with online vs shop split. */
  async getOverview() {
    const [paidOrders, activeOrders, totalProducts, inventory] = await Promise.all([
      this.prisma.order.findMany({
        where: { status: { in: PAID_STATUSES as any } },
        select: { totalAmount: true, channel: true },
      }),
      this.prisma.order.count({
        where: { status: { in: ACTIVE_STATUSES as any }, channel: 'ONLINE' },
      }),
      this.prisma.product.count(),
      this.prisma.inventory.findMany({
        select: { stock: true, reserved: true, lowStockThreshold: true },
      }),
    ]);

    const channels = { ONLINE: { revenue: 0, orders: 0 }, OFFLINE: { revenue: 0, orders: 0 } };
    for (const o of paidOrders) {
      channels[o.channel].revenue += Number(o.totalAmount);
      channels[o.channel].orders += 1;
    }
    const totalRevenue = channels.ONLINE.revenue + channels.OFFLINE.revenue;
    const orderCount = paidOrders.length;
    const available = inventory.map((i) => ({ left: i.stock - i.reserved, at: i.lowStockThreshold }));

    return {
      totalRevenue,
      totalOrders: orderCount,
      activeOrders,
      totalProducts,
      lowStockCount: available.filter((i) => i.left > 0 && i.left <= i.at).length,
      outOfStockCount: available.filter((i) => i.left <= 0).length,
      averageOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
      channels: {
        online: channels.ONLINE,
        offline: channels.OFFLINE,
      },
    };
  }

  /** Daily revenue + order count for the last `days` days (fills empty days with 0). */
  async getRevenueOverTime(days = 30) {
    // Days are Indian calendar days whatever the server's timezone, so a sale
    // at 00:30 IST lands on the day the shop recorded it.
    const IST = 330 * 60_000;
    const DAY = 86_400_000;
    const istDay = (d: Date) => new Date(d.getTime() + IST).toISOString().slice(0, 10);
    const todayStart = Date.parse(`${istDay(new Date())}T00:00:00Z`) - IST;
    const since = new Date(todayStart - (days - 1) * DAY);

    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: PAID_STATUSES as any },
        createdAt: { gte: since },
      },
      select: { totalAmount: true, createdAt: true, channel: true },
    });

    // Seed a bucket for every day so the chart has no gaps.
    const buckets = new Map<string, { revenue: number; orders: number; online: number; offline: number }>();
    for (let i = 0; i < days; i++) {
      buckets.set(istDay(new Date(since.getTime() + i * DAY)), { revenue: 0, orders: 0, online: 0, offline: 0 });
    }

    for (const o of orders) {
      const bucket = buckets.get(istDay(o.createdAt));
      if (bucket) {
        const amount = Number(o.totalAmount);
        bucket.revenue += amount;
        bucket.orders += 1;
        if (o.channel === 'OFFLINE') bucket.offline += amount;
        else bucket.online += amount;
      }
    }

    return Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }));
  }

  /** Best-selling products by units sold (paid orders only). */
  async getTopProducts(limit = 5) {
    const items = await this.prisma.orderItem.findMany({
      where: { order: { status: { in: PAID_STATUSES as any } } },
      select: {
        quantity: true,
        price: true,
        product: { select: { id: true, title: true } },
      },
    });

    const agg = new Map<
      string,
      { productId: string; title: string; unitsSold: number; revenue: number }
    >();
    for (const item of items) {
      const id = item.product.id;
      const entry = agg.get(id) ?? {
        productId: id,
        title: item.product.title,
        unitsSold: 0,
        revenue: 0,
      };
      entry.unitsSold += item.quantity;
      entry.revenue += Number(item.price) * item.quantity;
      agg.set(id, entry);
    }

    return Array.from(agg.values())
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, limit);
  }

  /** Order count grouped by status (for the status breakdown chart). */
  async getOrdersByStatus() {
    const grouped = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return grouped.map((g) => ({ status: g.status, count: g._count._all }));
  }

  /** Most recent orders for the dashboard activity feed. */
  async getRecentOrders(limit = 8) {
    const orders = await this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { quantity: true } },
      },
    });

    return orders.map((o) => ({
      id: o.id,
      customer: o.customerName || o.user?.name || 'Walk-in customer',
      channel: o.channel,
      email: o.user?.email ?? '',
      status: o.status,
      totalAmount: Number(o.totalAmount),
      itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
      createdAt: o.createdAt,
    }));
  }
}
