import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StockService } from '../inventory/stock.service';
import {
  BulkProductsDto,
  CreateProductDto,
  ImportProductsDto,
  UpdateProductDto,
  SearchProductsDto,
} from './dto/catalog.dto';

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

@Injectable()
export class CatalogService {
  constructor(
    private prisma: PrismaService,
    private stock: StockService,
  ) {}

  async search(dto: SearchProductsDto) {
    const {
      search,
      categorySlug,
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      halalOnly,
      featuredOnly,
      onSaleOnly,
      includeInactive,
      sort,
    } = dto;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Storefront sees active products only; admin passes includeInactive=true
    if (!includeInactive) {
      where.isActive = true;
    }

    // Filtering by Price Range
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Halal Certified Filter
    if (halalOnly) {
      where.halalCertified = true;
    }

    if (featuredOnly) {
      where.isFeatured = true;
    }

    if (onSaleOnly) {
      where.compareAtPrice = { not: null };
    }

    // Category Filter
    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    // Text Search Logic (combines words matching both Title and Description)
    // Postgres `contains` is case-sensitive, so ask for ILIKE explicitly.
    if (search) {
      // Split on punctuation too, so "Ramadan & Eid" doesn't demand a literal "&".
      const searchTerms = search
        .split(/[^\p{L}\p{N}]+/u)
        .filter((term) => term.length > 1);
      if (searchTerms.length > 0) {
        where.AND = searchTerms.map((term) => ({
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            { sku: { contains: term, mode: 'insensitive' } },
          ],
        }));
      }
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_low') orderBy = { price: 'asc' };
    else if (sort === 'price_high') orderBy = { price: 'desc' };
    else if (sort === 'featured') orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];

    const [total, data] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { inventory: true, category: true },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { inventory: true, category: true },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async create(dto: CreateProductDto) {
    // Check SKU conflicts
    const existing = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existing) {
      throw new ConflictException(`Product with SKU ${dto.sku} already exists`);
    }

    // Create Product and Inventory inside a Transaction
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          title: dto.title,
          description: dto.description,
          price: dto.price,
          compareAtPrice: dto.compareAtPrice || null,
          costPrice: dto.costPrice ?? null,
          sku: dto.sku,
          halalCertified: dto.halalCertified || false,
          isFeatured: dto.isFeatured || false,
          isActive: dto.isActive !== false,
          imageUrl: dto.imageUrl,
          images: dto.images,
          categoryId: dto.categoryId,
        },
      });

      await tx.inventory.create({ data: { productId: product.id, stock: 0 } });
      if (dto.stock) {
        await this.stock.move(tx, {
          productId: product.id,
          delta: dto.stock,
          type: 'RESTOCK',
          note: 'Opening stock',
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: { inventory: true, category: true },
      });
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id); // Throws if not exists

    if (dto.sku) {
      const existing = await this.prisma.product.findFirst({
        where: { sku: dto.sku, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Another product with SKU ${dto.sku} already exists`);
      }
    }

    const data: any = { ...dto };
    // compareAtPrice of 0 means "not on sale" — clear it
    if (data.compareAtPrice === 0) data.compareAtPrice = null;
    // Stock only changes through the inventory ledger.
    delete data.stock;

    return this.prisma.product.update({
      where: { id },
      data,
      include: { inventory: true, category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Throws if not exists

    const sold = await this.prisma.orderItem.count({ where: { productId: id } });
    if (sold > 0) {
      throw new BadRequestException(
        'This product appears in past orders, so it can’t be deleted. Hide it instead.',
      );
    }

    // Cascade deletes inventory and its stock history.
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  async bulk(dto: BulkProductsDto) {
    const where = { id: { in: dto.ids } };
    switch (dto.action) {
      case 'activate':
        return this.prisma.product.updateMany({ where, data: { isActive: true } });
      case 'hide':
        return this.prisma.product.updateMany({ where, data: { isActive: false } });
      case 'feature':
        return this.prisma.product.updateMany({ where, data: { isFeatured: true } });
      case 'unfeature':
        return this.prisma.product.updateMany({ where, data: { isFeatured: false } });
      case 'delete': {
        // Products with order history are hidden instead, so reports stay intact.
        const sold = await this.prisma.orderItem.findMany({
          where: { productId: { in: dto.ids } },
          select: { productId: true },
          distinct: ['productId'],
        });
        const keep = new Set(sold.map((s) => s.productId));
        const removable = dto.ids.filter((id) => !keep.has(id));
        await this.prisma.product.deleteMany({ where: { id: { in: removable } } });
        if (keep.size) {
          await this.prisma.product.updateMany({
            where: { id: { in: [...keep] } },
            data: { isActive: false },
          });
        }
        return { deleted: removable.length, hidden: keep.size };
      }
    }
  }

  /**
   * Create or update products from a spreadsheet, keyed by SKU. New SKUs need
   * a title and price; for existing SKUs only the filled-in cells change.
   * Unknown categories are created. A stock column sets the on-hand count
   * through the ledger. `dryRun` returns the per-row plan without writing.
   */
  async importProducts(dto: ImportProductsDto, userId?: string) {
    const skus = dto.rows.map((r) => r.sku?.trim()).filter(Boolean) as string[];
    const [existing, categories] = await Promise.all([
      this.prisma.product.findMany({
        where: { sku: { in: skus, mode: 'insensitive' } },
        include: { inventory: true },
      }),
      this.prisma.category.findMany(),
    ]);
    const bySku = new Map(existing.map((p) => [p.sku.toLowerCase(), p]));
    const catByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));
    const seen = new Set<string>();
    const newCategories = new Set<string>();

    const plan = dto.rows.map((row, i) => {
      const line = row.line ?? i + 2;
      const sku = row.sku?.trim() ?? '';
      const product = bySku.get(sku.toLowerCase());
      const base = { line, sku, title: row.title?.trim() || product?.title || null };
      const fail = (message: string) => ({ ...base, action: 'error' as const, message, changes: [] as string[] });

      if (!sku) return fail('SKU is missing');
      if (seen.has(sku.toLowerCase())) return fail('SKU appears more than once');
      seen.add(sku.toLowerCase());
      for (const key of ['price', 'compareAtPrice', 'costPrice'] as const) {
        const v = row[key];
        if (v !== undefined && (!Number.isFinite(v) || v < 0)) return fail(`${key} must be a positive number`);
      }
      if (row.stock !== undefined && (!Number.isInteger(row.stock) || row.stock < 0)) {
        return fail('Stock must be a whole number, 0 or more');
      }
      if (!product) {
        if (!row.title?.trim()) return fail('New products need a title');
        if (row.price === undefined) return fail('New products need a price');
      }
      const categoryName = row.category?.trim();
      if (categoryName && !catByName.has(categoryName.toLowerCase())) {
        newCategories.add(categoryName);
      }

      const changes: string[] = [];
      if (product) {
        if (row.title && row.title.trim() !== product.title) changes.push('title');
        if (row.description && row.description.trim() !== product.description) changes.push('description');
        if (row.price !== undefined && row.price !== Number(product.price)) changes.push('price');
        if (row.compareAtPrice !== undefined && row.compareAtPrice !== Number(product.compareAtPrice ?? 0)) changes.push('compare-at price');
        if (row.costPrice !== undefined && row.costPrice !== Number(product.costPrice ?? -1)) changes.push('cost');
        if (categoryName && catByName.get(categoryName.toLowerCase())?.id !== product.categoryId) changes.push('category');
        if (row.halalCertified !== undefined && row.halalCertified !== product.halalCertified) changes.push('halal');
        if (row.isFeatured !== undefined && row.isFeatured !== product.isFeatured) changes.push('featured');
        if (row.isActive !== undefined && row.isActive !== product.isActive) changes.push(row.isActive ? 'shown' : 'hidden');
        if (row.imageUrl && row.imageUrl !== product.imageUrl) changes.push('image');
        if (row.images?.length) changes.push('gallery');
        if (row.stock !== undefined && row.stock !== (product.inventory?.stock ?? 0)) {
          changes.push(`stock ${product.inventory?.stock ?? 0} → ${row.stock}`);
        }
      }
      return {
        ...base,
        action: product ? (changes.length ? ('update' as const) : ('unchanged' as const)) : ('create' as const),
        message: null as string | null,
        changes,
      };
    });

    const summary = {
      create: plan.filter((p) => p.action === 'create').length,
      update: plan.filter((p) => p.action === 'update').length,
      unchanged: plan.filter((p) => p.action === 'unchanged').length,
      errors: plan.filter((p) => p.action === 'error').length,
      newCategories: [...newCategories],
      rows: plan,
    };
    if (dto.dryRun) return { ...summary, applied: false };
    if (summary.errors) {
      throw new BadRequestException(`${summary.errors} row(s) have errors; fix them and import again`);
    }

    await this.prisma.$transaction(
      async (tx) => {
        for (const name of newCategories) {
          const base = slugify(name) || 'category';
          let slug = base;
          for (let n = 2; await tx.category.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`;
          const created = await tx.category.create({ data: { name, slug } });
          catByName.set(name.toLowerCase(), created);
        }

        for (const [i, row] of dto.rows.entries()) {
          const step = plan[i];
          if (step.action === 'unchanged') continue;
          const categoryId = row.category?.trim()
            ? catByName.get(row.category.trim().toLowerCase())?.id
            : undefined;
          const images = row.images?.length ? JSON.stringify(row.images) : undefined;
          const fields = {
            ...(row.title?.trim() ? { title: row.title.trim() } : {}),
            ...(row.description?.trim() ? { description: row.description.trim() } : {}),
            ...(row.price !== undefined ? { price: row.price } : {}),
            ...(row.compareAtPrice !== undefined ? { compareAtPrice: row.compareAtPrice || null } : {}),
            ...(row.costPrice !== undefined ? { costPrice: row.costPrice } : {}),
            ...(categoryId ? { categoryId } : {}),
            ...(row.halalCertified !== undefined ? { halalCertified: row.halalCertified } : {}),
            ...(row.isFeatured !== undefined ? { isFeatured: row.isFeatured } : {}),
            ...(row.isActive !== undefined ? { isActive: row.isActive } : {}),
            ...(row.imageUrl ? { imageUrl: row.imageUrl } : {}),
            ...(images ? { images } : {}),
          };

          const current = bySku.get(step.sku.toLowerCase());
          let productId: string;
          let onHand = 0;
          if (current) {
            await tx.product.update({ where: { id: current.id }, data: fields });
            productId = current.id;
            onHand = current.inventory?.stock ?? 0;
            if (!current.inventory) await tx.inventory.create({ data: { productId, stock: 0 } });
          } else {
            const created = await tx.product.create({
              data: {
                title: row.title!.trim(),
                description: row.description?.trim() || row.title!.trim(),
                price: row.price!,
                sku: step.sku,
                ...fields,
              },
            });
            productId = created.id;
            await tx.inventory.create({ data: { productId, stock: 0 } });
          }

          if (row.stock !== undefined && row.stock !== onHand) {
            await this.stock.move(tx, {
              productId,
              delta: row.stock - onHand,
              type: 'IMPORT',
              note: current ? 'Product spreadsheet import' : 'Opening stock (product import)',
              userId,
            });
          }
        }
      },
      { timeout: 120_000 },
    );

    return { ...summary, applied: true };
  }
}
