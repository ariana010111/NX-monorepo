import { Injectable } from '@nestjs/common';
import { InventoryItemResponseDto } from './dto/inventory-response.dto';

export abstract class InventoryRepository {
  abstract findAll(): Promise<InventoryItemResponseDto[]>;
  abstract findByVariantId(variantId: string): Promise<InventoryItemResponseDto | null>;
  abstract adjustOnHand(variantId: string, quantityChange: number): Promise<InventoryItemResponseDto | null>;
  abstract reserve(variantId: string, quantity: number): Promise<InventoryItemResponseDto | null>;
  abstract createItem(item: {
    variantId: string;
    productName: string;
    variantLabel: string;
    quantityOnHand: number;
    lowStockThreshold?: number;
  }): Promise<InventoryItemResponseDto>;
}

/**
 * TEMPORARY in-memory implementation. Seeded to match the demo variants in
 * catalog/products.repository.ts. The real Prisma-backed version reads/
 * writes InventoryItem rows and appends an InventoryTransaction row on every
 * change (RESTOCK/RESERVATION/ADJUSTMENT) — see the approved schema. This
 * stub tracks onHand/reserved directly without the transaction ledger,
 * which is exactly the kind of shortcut the real repository must not take.
 */
@Injectable()
export class InMemoryInventoryRepository implements InventoryRepository {
  private items: (InventoryItemResponseDto & { quantityOnHand: number; quantityReserved: number })[] = [
    { variantId: 'v1', productName: 'Velvet Matte Lipstick', variantLabel: 'Rosy Pink', quantityOnHand: 42, quantityReserved: 0, quantityAvailable: 42, lowStockThreshold: 10 },
    { variantId: 'v2', productName: 'Velvet Matte Lipstick', variantLabel: 'Brick Red', quantityOnHand: 8, quantityReserved: 0, quantityAvailable: 8, lowStockThreshold: 10 },
    { variantId: 'v3', productName: 'Velvet Matte Lipstick', variantLabel: 'Nude Blush', quantityOnHand: 15, quantityReserved: 0, quantityAvailable: 15, lowStockThreshold: 10 },
    { variantId: 'v4', productName: 'Hydrating Rose Serum', variantLabel: '30ml', quantityOnHand: 25, quantityReserved: 0, quantityAvailable: 25, lowStockThreshold: 5 },
    { variantId: 'v5', productName: 'Hydrating Rose Serum', variantLabel: '50ml', quantityOnHand: 3, quantityReserved: 0, quantityAvailable: 3, lowStockThreshold: 5 },
  ];

  private recompute(item: (typeof this.items)[number]) {
    item.quantityAvailable = item.quantityOnHand - item.quantityReserved;
    return item;
  }

  async findAll() {
    return this.items;
  }

  async findByVariantId(variantId: string) {
    return this.items.find((i) => i.variantId === variantId) ?? null;
  }

  async adjustOnHand(variantId: string, quantityChange: number) {
    const item = this.items.find((i) => i.variantId === variantId);
    if (!item) return null;
    item.quantityOnHand += quantityChange;
    return this.recompute(item);
  }

  async reserve(variantId: string, quantity: number) {
    const item = this.items.find((i) => i.variantId === variantId);
    if (!item) return null;
    item.quantityReserved += quantity;
    return this.recompute(item);
  }

  async createItem(item: { variantId: string; productName: string; variantLabel: string; quantityOnHand: number; lowStockThreshold?: number }) {
    const created = {
      variantId: item.variantId,
      productName: item.productName,
      variantLabel: item.variantLabel,
      quantityOnHand: item.quantityOnHand,
      quantityReserved: 0,
      quantityAvailable: item.quantityOnHand,
      lowStockThreshold: item.lowStockThreshold ?? 5,
    };
    this.items.push(created);
    return created;
  }
}
