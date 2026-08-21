import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryRepository } from './inventory.repository';
import { InsufficientStockException } from './insufficient-stock.exception';

@Injectable()
export class InventoryService {
  constructor(private readonly inventoryRepo: InventoryRepository) {}

  list() {
    return this.inventoryRepo.findAll();
  }

  async getByVariantId(variantId: string) {
    const item = await this.inventoryRepo.findByVariantId(variantId);
    if (!item) throw new NotFoundException(`No inventory record for variant "${variantId}"`);
    return item;
  }

  async adjustStock(variantId: string, quantityChange: number) {
    const updated = await this.inventoryRepo.adjustOnHand(variantId, quantityChange);
    if (!updated) throw new NotFoundException(`No inventory record for variant "${variantId}"`);
    return updated;
  }

  /**
   * Called by ProductsService.addVariant — every new variant gets a real
   * InventoryItem row immediately, not left to be discovered missing the
   * first time someone tries to check out with it. Without this, a
   * product created via the admin API would have a variant with no
   * inventory record at all, and reserveForOrder() would 404 rather than
   * correctly reporting "out of stock."
   */
  initializeForVariant(item: { variantId: string; productName: string; variantLabel: string; initialStock?: number }) {
    return this.inventoryRepo.createItem({
      variantId: item.variantId,
      productName: item.productName,
      variantLabel: item.variantLabel,
      quantityOnHand: item.initialStock ?? 0,
    });
  }

  /**
   * Called by OrdersService when a new order is placed. Reserves stock
   * rather than decrementing onHand directly — matches the schema's
   * quantityOnHand/quantityReserved split, since the order isn't paid yet.
   * Throws before any reservation happens if ANY line item lacks
   * available stock, so a multi-item order either fully reserves or
   * fully fails — no partial reservations left dangling.
   */
  async reserveForOrder(items: { variantId: string; quantity: number }[]) {
    for (const line of items) {
      const current = await this.getByVariantId(line.variantId);
      if (current.quantityAvailable < line.quantity) {
        throw new InsufficientStockException(line.variantId, line.quantity, current.quantityAvailable);
      }
    }
    for (const line of items) {
      await this.inventoryRepo.reserve(line.variantId, line.quantity);
    }
  }
}
