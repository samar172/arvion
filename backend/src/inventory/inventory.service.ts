import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getAllInventory() {
    return this.prisma.inventory.findMany({
      include: {
        product: {
          select: { title: true, sku: true, price: true }
        }
      }
    });
  }

  async updateStock(productId: string, stock: number) {
    return this.prisma.inventory.update({
      where: { productId },
      data: { stock }
    });
  }
}
