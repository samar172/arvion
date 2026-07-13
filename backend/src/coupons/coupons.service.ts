import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
    return coupon;
  }

  async create(dto: CreateCouponDto) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      throw new ConflictException(`Coupon ${code} already exists`);
    }
    return this.prisma.coupon.create({
      data: {
        ...dto,
        code,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.code) data.code = dto.code.trim().toUpperCase();
    if (dto.expiresAt !== undefined) {
      data.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    }
    return this.prisma.coupon.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.coupon.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Validates a coupon against a subtotal and returns the computed discount.
   * Used both by the public validate endpoint and by order creation.
   */
  async validate(code: string, subtotal: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!coupon || !coupon.active) {
      throw new BadRequestException('Invalid coupon code');
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('This coupon has expired');
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('This coupon has reached its usage limit');
    }
    const minOrder = coupon.minOrderAmount ? Number(coupon.minOrderAmount) : 0;
    if (subtotal < minOrder) {
      throw new BadRequestException(`Minimum order of ₹${minOrder} required for this coupon`);
    }

    let discount =
      coupon.type === 'PERCENT'
        ? (subtotal * Number(coupon.value)) / 100
        : Number(coupon.value);
    if (coupon.maxDiscount) {
      discount = Math.min(discount, Number(coupon.maxDiscount));
    }
    discount = Math.min(Math.round(discount * 100) / 100, subtotal);

    return {
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      discount,
      total: Math.round((subtotal - discount) * 100) / 100,
    };
  }

  async markUsed(code: string) {
    await this.prisma.coupon.update({
      where: { code: code.trim().toUpperCase() },
      data: { usedCount: { increment: 1 } },
    });
  }
}
