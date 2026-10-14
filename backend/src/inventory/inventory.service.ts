import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { StockService } from './stock.service';
import {
  AdjustStockDto,
  ImportStockDto,
  InventoryQueryDto,
  MovementsQueryDto,
} from './dto/inventory.dto';

const DAY = 24 * 60 * 60 * 1000;

export type StockStatus = 'in' | 'low' | 'out';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private stock: StockService,
  ) {}

  /**
   * Every product with stock figures, 30-day sales split by channel, and
   * catalogue-wide totals. Filtering happens in memory: status depends on a
   * computed value and a gifting catalogue is a few thousand rows at most.
   */
  async list(q: InventoryQueryDto) {
    const since = new Date(Date.now() - 30 * DAY);
    const [products, sold] = await Promise.all([
      this.prisma.product.findMany({
        include: { inventory: true, category: { select: { id: true, name: true } } },
      }),
      this.prisma.stockMovement.groupBy({
        by: ['productId', 'type'],
        where: { createdAt: { gte: since }, type: { in: ['SALE_ONLINE', 'SALE_OFFLINE'] } },
        _sum: { quantity: true },
      }),
    ]);

    const soldMap = new Map<string, { online: number; offline: number }>();
    for (const s of sold) {
      const entry = soldMap.get(s.productId) ?? { online: 0, offline: 0 };
      const units = -(s._sum.quantity ?? 0);
      if (s.type === 'SALE_ONLINE') entry.online += units;
      else entry.offline += units;
      soldMap.set(s.productId, entry);
    }

    const rows = products.map((p) => {
      const stock = p.inventory?.stock ?? 0;
      const reserved = p.inventory?.reserved ?? 0;
      const available = stock - reserved;
      const threshold = p.inventory?.lowStockThreshold ?? 5;
      const status: StockStatus = available <= 0 ? 'out' : available <= threshold ? 'low' : 'in';
      const s = soldMap.get(p.id) ?? { online: 0, offline: 0 };
      return {
        productId: p.id,
        title: p.title,
        sku: p.sku,
        imageUrl: p.imageUrl,
        isActive: p.isActive,
        category: p.category,
        price: Number(p.price),
        costPrice: p.costPrice != null ? Number(p.costPrice) : null,
        stock,
        reserved,
        available,
        lowStockThreshold: threshold,
        status,
        sold30: { online: s.online, offline: s.offline, total: s.online + s.offline },
        updatedAt: p.inventory?.updatedAt ?? p.updatedAt,
      };
    });

    const summary = {
      skus: rows.length,
      units: rows.reduce((n, r) => n + r.stock, 0),
      reserved: rows.reduce((n, r) => n + r.reserved, 0),
      retailValue: rows.reduce((n, r) => n + Math.max(r.stock, 0) * r.price, 0),
      costValue: rows.reduce((n, r) => n + Math.max(r.stock, 0) * (r.costPrice ?? 0), 0),
      missingCost: rows.filter((r) => r.costPrice == null && r.stock > 0).length,
      low: rows.filter((r) => r.status === 'low').length,
      out: rows.filter((r) => r.status === 'out').length,
      sold30Online: rows.reduce((n, r) => n + r.sold30.online, 0),
      sold30Offline: rows.reduce((n, r) => n + r.sold30.offline, 0),
    };

    const term = q.search?.trim().toLowerCase();
    let filtered = rows.filter((r) => {
      if (q.status && q.status !== 'all' && r.status !== q.status) return false;
      if (q.categoryId && r.category?.id !== q.categoryId) return false;
      if (term && !r.title.toLowerCase().includes(term) && !r.sku.toLowerCase().includes(term)) {
        return false;
      }
      return true;
    });

    const dir = q.order === 'asc' ? 1 : -1;
    const key = q.sort ?? 'available';
    const value = (r: (typeof rows)[number]): number | string => {
      switch (key) {
        case 'title':
          return r.title.toLowerCase();
        case 'sold':
          return r.sold30.total;
        case 'value':
          return r.stock * r.price;
        case 'updated':
          return new Date(r.updatedAt).getTime();
        default:
          return r.available;
      }
    };
    filtered = filtered.sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      return va < vb ? -dir : va > vb ? dir : 0;
    });

    const total = filtered.length;
    const limit = q.limit ?? 50;
    const page = q.page ?? 1;
    const data = q.all ? filtered : filtered.slice((page - 1) * limit, page * limit);

    return { summary, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)), data };
  }

  /** Receive, remove, or recount one product's stock. */
  async adjust(productId: string, dto: AdjustStockDto, userId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.$transaction(async (tx) => {
      if (dto.lowStockThreshold !== undefined) {
        await tx.inventory.upsert({
          where: { productId },
          update: { lowStockThreshold: dto.lowStockThreshold },
          create: { productId, stock: 0, lowStockThreshold: dto.lowStockThreshold },
        });
      }

      if (dto.mode && dto.quantity !== undefined) {
        const current = product.inventory?.stock ?? 0;
        const delta =
          dto.mode === 'set'
            ? dto.quantity - current
            : dto.mode === 'remove'
              ? -Math.abs(dto.quantity)
              : Math.abs(dto.quantity);
        const type: StockMovementType =
          dto.reason ?? (dto.mode === 'add' ? 'RESTOCK' : 'ADJUSTMENT');
        await this.stock.move(tx, {
          productId,
          delta,
          type,
          note: dto.note,
          userId,
        });
      }

      return tx.inventory.findUnique({ where: { productId } });
    });
  }

  async movements(q: MovementsQueryDto) {
    const where: Prisma.StockMovementWhereInput = {};
    if (q.productId) where.productId = q.productId;
    if (q.type) where.type = q.type;
    if (q.channel === 'ONLINE') where.type = 'SALE_ONLINE';
    if (q.channel === 'OFFLINE') where.type = 'SALE_OFFLINE';
    if (q.from || q.to) {
      where.createdAt = {};
      if (q.from) where.createdAt.gte = new Date(q.from);
      if (q.to) where.createdAt.lte = new Date(new Date(q.to).getTime() + DAY - 1);
    }
    if (q.search?.trim()) {
      const term = q.search.trim();
      where.product = {
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { sku: { contains: term, mode: 'insensitive' } },
        ],
      };
    }

    const limit = q.limit ?? 50;
    const page = q.page ?? 1;
    const [total, rows] = await Promise.all([
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.findMany({
        where,
        include: { product: { select: { title: true, sku: true, imageUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip: q.all ? undefined : (page - 1) * limit,
        take: q.all ? 5000 : limit,
      }),
    ]);

    const userIds = [...new Set(rows.map((r) => r.createdById).filter(Boolean))] as string[];
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        })
      : [];
    const names = new Map(users.map((u) => [u.id, u.name]));

    return {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      data: rows.map((r) => ({ ...r, createdBy: r.createdById ? names.get(r.createdById) ?? null : null })),
    };
  }

  /**
   * Stock-count import from a spreadsheet. `dryRun` validates every row and
   * reports what would change without writing, so the admin sees the preview
   * before committing. Applying is all-or-nothing.
   */
  async importStock(dto: ImportStockDto, userId?: string) {
    const skus = [...new Set(dto.rows.map((r) => r.sku?.trim()).filter(Boolean))];
    const products = await this.prisma.product.findMany({
      where: { sku: { in: skus } },
      select: { id: true, sku: true, title: true, inventory: true },
    });
    const bySku = new Map(products.map((p) => [p.sku.toLowerCase(), p]));
    const seen = new Set<string>();

    const results = dto.rows.map((row, i) => {
      const line = row.line ?? i + 2;
      const sku = row.sku?.trim();
      const product = sku ? bySku.get(sku.toLowerCase()) : undefined;
      const current = product?.inventory?.stock ?? 0;
      const base = { line, sku: sku ?? '', title: product?.title ?? null, current };

      if (!sku) return { ...base, status: 'error' as const, message: 'SKU is missing' };
      if (!product) return { ...base, status: 'error' as const, message: 'No product with this SKU' };
      if (seen.has(product.id)) {
        return { ...base, status: 'error' as const, message: 'SKU appears more than once' };
      }
      seen.add(product.id);
      if (!Number.isInteger(row.quantity)) {
        return { ...base, status: 'error' as const, message: 'Quantity must be a whole number' };
      }

      const next = dto.mode === 'add' ? current + row.quantity : row.quantity;
      if (next < 0) {
        return { ...base, status: 'error' as const, message: `Would leave ${next} in stock` };
      }
      return {
        ...base,
        productId: product.id,
        next,
        delta: next - current,
        status: next === current ? ('unchanged' as const) : ('ok' as const),
        message: null,
      };
    });

    const errors = results.filter((r) => r.status === 'error').length;
    const changes = results.filter(
      (r): r is Extract<(typeof results)[number], { productId: string }> => r.status === 'ok',
    );
    const report = { mode: dto.mode, errors, changes: changes.length, rows: results };

    if (dto.dryRun) return { ...report, applied: false };
    if (errors) {
      throw new BadRequestException(`${errors} row(s) have errors; fix them and import again`);
    }

    const note = dto.note?.trim() || `Spreadsheet import (${dto.mode === 'add' ? 'received' : 'stock count'})`;
    await this.prisma.$transaction(
      async (tx) => {
        for (const r of changes) {
          await this.stock.move(tx, {
            productId: r.productId,
            delta: r.delta,
            type: 'IMPORT',
            note,
            userId,
          });
        }
      },
      { timeout: 60_000 },
    );

    return { ...report, applied: true };
  }
}
