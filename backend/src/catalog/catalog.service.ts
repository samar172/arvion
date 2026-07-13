import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto, UpdateProductDto, SearchProductsDto } from './dto/catalog.dto';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

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
    // Note: SQLite `contains` is case-insensitive for ASCII by default.
    if (search) {
      const searchTerms = search.split(/\s+/).filter(Boolean);
      if (searchTerms.length > 0) {
        where.AND = searchTerms.map((term) => ({
          OR: [
            { title: { contains: term } },
            { description: { contains: term } },
            { sku: { contains: term } },
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
          sku: dto.sku,
          halalCertified: dto.halalCertified || false,
          isFeatured: dto.isFeatured || false,
          isActive: dto.isActive !== false,
          imageUrl: dto.imageUrl,
          images: dto.images,
          categoryId: dto.categoryId,
        },
      });

      await tx.inventory.create({
        data: {
          productId: product.id,
          stock: dto.stock || 0,
        },
      });

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

    return this.prisma.product.update({
      where: { id },
      data,
      include: { inventory: true, category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Throws if not exists

    // Cascade deletes inventory automatically due to prisma schema rules
    await this.prisma.product.delete({
      where: { id },
    });

    return { success: true };
  }
}
