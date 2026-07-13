import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  findActive() {
    return this.prisma.banner.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }
    return banner;
  }

  create(dto: CreateBannerDto) {
    return this.prisma.banner.create({ data: dto });
  }

  async update(id: string, dto: UpdateBannerDto) {
    await this.findOne(id);
    return this.prisma.banner.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.banner.delete({ where: { id } });
    return { success: true };
  }
}
