import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
 * Inventory persistence backed by InventoryItem and its append-only ledger.
 * catalog/products.repository.ts. The real Prisma-backed version reads/
 * writes InventoryItem rows and appends an InventoryTransaction row on every
 * change (RESTOCK/RESERVATION/ADJUSTMENT) — see the approved schema. This
 * stub tracks onHand/reserved directly without the transaction ledger,
 * which is exactly the kind of shortcut the real repository must not take.
 */
@Injectable()
export class PrismaInventoryRepository implements InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}
  private map(item: any): InventoryItemResponseDto { return { variantId: item.variantId, productName: item.variant.product.name, variantLabel: item.variant.attributeValues.map((link: any) => link.attributeValue.value).join(' / '), quantityOnHand: item.quantityOnHand, quantityReserved: item.quantityReserved, quantityAvailable: item.quantityOnHand - item.quantityReserved, lowStockThreshold: item.lowStockThreshold }; }
  private include = { variant: { include: { product: true, attributeValues: { include: { attributeValue: true } } } } };
  async findAll() { return (await this.prisma.inventoryItem.findMany({ include: this.include, orderBy: { updatedAt: 'desc' } })).map((item) => this.map(item)); }
  async findByVariantId(variantId: string) { const item = await this.prisma.inventoryItem.findFirst({ where: { variantId }, include: this.include }); return item ? this.map(item) : null; }
  async adjustOnHand(variantId: string, quantityChange: number) { const item = await this.prisma.inventoryItem.findFirst({ where: { variantId } }); if (!item) return null; const updated = await this.prisma.$transaction(async (tx) => { const next = await tx.inventoryItem.update({ where: { id: item.id }, data: { quantityOnHand: { increment: quantityChange } }, include: this.include }); await tx.inventoryTransaction.create({ data: { inventoryItemId: item.id, type: quantityChange >= 0 ? 'RESTOCK' : 'ADJUSTMENT', quantityChange } }); return next; }); return this.map(updated); }
  async reserve(variantId: string, quantity: number) { const item = await this.prisma.inventoryItem.findFirst({ where: { variantId } }); if (!item) return null; const updated = await this.prisma.$transaction(async (tx) => { const next = await tx.inventoryItem.update({ where: { id: item.id }, data: { quantityReserved: { increment: quantity } }, include: this.include }); await tx.inventoryTransaction.create({ data: { inventoryItemId: item.id, type: 'RESERVATION', quantityChange: -quantity } }); return next; }); return this.map(updated); }
  async createItem(item: { variantId: string; productName: string; variantLabel: string; quantityOnHand: number; lowStockThreshold?: number }) { const variant = await this.prisma.productVariant.findUniqueOrThrow({ where: { id: item.variantId }, include: { product: true } }); const warehouse = await this.prisma.warehouse.findFirstOrThrow({ where: { sellerId: variant.sellerId, isActive: true } }); const created = await this.prisma.inventoryItem.upsert({ where: { variantId_warehouseId: { variantId: item.variantId, warehouseId: warehouse.id } }, update: { quantityOnHand: item.quantityOnHand, lowStockThreshold: item.lowStockThreshold ?? 5 }, create: { variantId: item.variantId, sellerId: variant.sellerId, warehouseId: warehouse.id, quantityOnHand: item.quantityOnHand, lowStockThreshold: item.lowStockThreshold ?? 5 }, include: this.include }); return this.map(created); }
}
