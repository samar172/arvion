import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto, UpdateProductDto, SearchProductsDto } from './dto/catalog.dto';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async search(dto: SearchProductsDto) {
    const { search, page = 1, limit = 10, minPrice, maxPrice, halalOnly } = dto;
    const skip = (page - 1) * limit;

    const where: any = {};

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

    // Text Search Logic (combines words matching both Title and Description)
    if (search) {
      const searchTerms = search.split(/\s+/).filter(Boolean);
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

    const [total, data] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { inventory: true },
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
      include: { inventory: true },
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
          sku: dto.sku,
          halalCertified: dto.halalCertified || false,
          imageUrl: dto.imageUrl,
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
        include: { inventory: true },
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

    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { inventory: true },
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
