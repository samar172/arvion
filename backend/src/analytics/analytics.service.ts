import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// Orders in these states represent real, paid revenue.
const PAID_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
// Orders still moving through fulfillment (not yet delivered / cancelled).
const ACTIVE_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED'];
const LOW_STOCK_THRESHOLD = 10;

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /** Top-line KPIs for the dashboard cards. */
  async getOverview() {
    const [paidOrders, activeOrders, totalProducts, lowStock] =
      await Promise.all([
        this.prisma.order.findMany({
          where: { status: { in: PAID_STATUSES as any } },
          select: { totalAmount: true },
        }),
        this.prisma.order.count({
          where: { status: { in: ACTIVE_STATUSES as any } },
        }),
        this.prisma.product.count(),
        this.prisma.inventory.count({
          where: { stock: { lt: LOW_STOCK_THRESHOLD } },
        }),
      ]);

    const totalRevenue = paidOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
    );
    const orderCount = paidOrders.length;

    return {
      totalRevenue,
      totalOrders: orderCount,
      activeOrders,
      totalProducts,
      lowStockCount: lowStock,
      averageOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
    };
  }

  /** Daily revenue + order count for the last `days` days (fills empty days with 0). */
  async getRevenueOverTime(days = 30) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: PAID_STATUSES as any },
        createdAt: { gte: since },
      },
      select: { totalAmount: true, createdAt: true },
    });

    // Seed a bucket for every day so the chart has no gaps.
    const buckets = new Map<string, { revenue: number; orders: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      buckets.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
    }

    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.revenue += Number(o.totalAmount);
        bucket.orders += 1;
      }
    }

    return Array.from(buckets.entries()).map(([date, v]) => ({
      date,
      revenue: v.revenue,
      orders: v.orders,
    }));
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
      customer: o.user?.name ?? 'Unknown',
      email: o.user?.email ?? '',
      status: o.status,
      totalAmount: Number(o.totalAmount),
      itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
      createdAt: o.createdAt,
    }));
  }
}
