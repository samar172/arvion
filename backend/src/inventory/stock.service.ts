import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';

type Tx = Prisma.TransactionClient;

export interface MovementInput {
  productId: string;
  /** Signed change to stock on hand. */
  delta: number;
  type: StockMovementType;
  orderId?: string | null;
  note?: string | null;
  userId?: string | null;
  /** Also move this many units out of `reserved` (online orders being paid). */
  releaseReserved?: number;
  /** Allow stock to go below zero (never for manual edits; online payments already reserved it). */
  allowNegative?: boolean;
}

/**
 * The single path for changing stock on hand. Every call updates Inventory and
 * appends a StockMovement in the caller's transaction, so the ledger always
 * explains the current number — online sales, shop sales, restocks and imports alike.
 */
@Injectable()
export class StockService {
  async move(tx: Tx, input: MovementInput) {
    const { productId, delta, releaseReserved = 0 } = input;

    const inventory =
      (await tx.inventory.findUnique({ where: { productId } })) ??
      (await tx.inventory.create({ data: { productId, stock: 0 } }));

    // Conditional update: the stock check and the write are one statement, so
    // two concurrent sales of the last unit cannot both succeed.
    const guard = delta < 0 && !input.allowNegative ? { stock: { gte: -delta } } : {};
    const { count } = await tx.inventory.updateMany({
      where: { productId, ...guard },
      data: {
        stock: { increment: delta },
        ...(releaseReserved ? { reserved: { decrement: releaseReserved } } : {}),
      },
    });
    if (count === 0) {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { title: true },
      });
      throw new BadRequestException(
        `Not enough stock for ${product?.title ?? productId}: ${inventory.stock} on hand, ${-delta} requested`,
      );
    }

    const updated = await tx.inventory.findUniqueOrThrow({ where: { productId } });

    if (delta !== 0) {
      await tx.stockMovement.create({
        data: {
          productId,
          type: input.type,
          quantity: delta,
          balanceAfter: updated.stock,
          orderId: input.orderId ?? null,
          note: input.note ?? null,
          createdById: input.userId ?? null,
        },
      });
    }

    return updated;
  }
}
