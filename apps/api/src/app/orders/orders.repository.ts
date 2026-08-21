import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';

export interface CreateOrderInput {
  dto: CreateOrderDto;
  userId?: string; // undefined = guest checkout
  discountTotal: number;
  couponCode?: string;
}

export abstract class OrdersRepository {
  abstract create(input: CreateOrderInput): Promise<OrderResponseDto>;
  abstract findById(id: string): Promise<OrderResponseDto | null>;
  abstract findAll(): Promise<OrderResponseDto[]>;
  abstract findByUserId(userId: string): Promise<OrderResponseDto[]>;
  abstract updateStatus(id: string, status: string): Promise<OrderResponseDto | null>;
}

/**
 * TEMPORARY in-memory implementation — same pattern as the catalog
 * repositories. The real Prisma-backed version writes Order + OrderItem
 * rows with the snapshot fields (productNameSnapshot, unitPriceSnapshot,
 * etc. — see the approved schema) rather than these flattened DTO fields,
 * but the shape returned to callers is unchanged.
 */
@Injectable()
export class PrismaOrdersRepository implements OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}
  private include = { items: { include: { variant: { include: { attributeValues: { include: { attributeValue: true } }, images: { where: { isPrimary: true }, take: 1 } } }, product: true } } };
  private map(order: any): OrderResponseDto { return { id: order.id, orderNumber: order.orderNumber, email: order.email, userId: order.userId, status: order.status, currency: order.currency, subtotal: Number(order.subtotal), discountTotal: Number(order.discountTotal) || undefined, couponCode: order.couponCode ?? undefined, grandTotal: Number(order.grandTotal), items: order.items.map((item: any) => ({ variantId: item.variantId, productName: item.productNameSnapshot, variantLabel: item.variantAttributesSnapshot ? Object.values(item.variantAttributesSnapshot as Record<string, string>).join(' / ') : item.variantSkuSnapshot, unitPrice: Number(item.unitPriceSnapshot), quantity: item.quantity, lineTotal: Number(item.lineTotal) })), placedAt: order.placedAt.toISOString() }; }
  async create({ dto, userId, discountTotal, couponCode }: CreateOrderInput) {
    const variants = await this.prisma.productVariant.findMany({ where: { id: { in: dto.items.map((item) => item.variantId) }, deletedAt: null }, include: { product: true, seller: true, attributeValues: { include: { attributeValue: { include: { attribute: true } } } }, images: { where: { isPrimary: true }, take: 1 } } });
    const byId = new Map(variants.map((variant) => [variant.id, variant]));
    const items = dto.items.map((input) => { const variant = byId.get(input.variantId); if (!variant) throw new Error(`Variant "${input.variantId}" not found`); const attributes = Object.fromEntries(variant.attributeValues.map((link) => [link.attributeValue.attribute.name, link.attributeValue.value])); return { input, variant, attributes, lineTotal: Math.round(input.unitPrice * input.quantity * 100) / 100 }; });
    const subtotal = Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
    const grandTotal = Math.round((subtotal - discountTotal) * 100) / 100;
    const shippingAddress = { fullName: dto.shippingAddress.fullName, line1: dto.shippingAddress.line1, city: dto.shippingAddress.city, postalCode: dto.shippingAddress.postalCode, country: dto.shippingAddress.country };
    const order = await this.prisma.order.create({ data: { orderNumber: `ORD-${new Date().getFullYear()}-${Date.now()}`, email: dto.email, userId, status: 'PENDING_PAYMENT', subtotal, discountTotal, grandTotal, couponCode, shippingAddress, billingAddress: shippingAddress, items: { create: items.map(({ input, variant, attributes, lineTotal }) => ({ sellerId: variant.sellerId, productId: variant.productId, variantId: variant.id, productNameSnapshot: variant.product.name, variantSkuSnapshot: variant.sku, variantAttributesSnapshot: attributes, imageUrlSnapshot: variant.images[0]?.url, unitPriceSnapshot: input.unitPrice, quantity: input.quantity, lineTotal })) } }, include: this.include });
    return this.map(order);
  }
  async findById(id: string) { const order = await this.prisma.order.findUnique({ where: { id }, include: this.include }); return order ? this.map(order) : null; }
  async findAll() { return (await this.prisma.order.findMany({ include: this.include, orderBy: { placedAt: 'desc' } })).map((order) => this.map(order)); }
  async findByUserId(userId: string) { return (await this.prisma.order.findMany({ where: { userId }, include: this.include, orderBy: { placedAt: 'desc' } })).map((order) => this.map(order)); }
  async updateStatus(id: string, status: string) { const result = await this.prisma.order.updateMany({ where: { id }, data: { status: status as any } }); if (!result.count) return null; await this.prisma.orderStatusHistory.create({ data: { orderId: id, status } }); return this.map(await this.prisma.order.findUniqueOrThrow({ where: { id }, include: this.include })); }
}
