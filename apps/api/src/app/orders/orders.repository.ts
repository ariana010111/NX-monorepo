import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';

export abstract class OrdersRepository {
  abstract create(dto: CreateOrderDto): Promise<OrderResponseDto>;
  abstract findById(id: string): Promise<OrderResponseDto | null>;
  abstract findAll(): Promise<OrderResponseDto[]>;
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
export class InMemoryOrdersRepository implements OrdersRepository {
  private orders: OrderResponseDto[] = [];
  private counter = 1000;

  async create(dto: CreateOrderDto) {
    const items = dto.items.map((item) => ({
      variantId: item.variantId,
      productName: item.productName,
      variantLabel: item.variantLabel,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: Math.round(item.unitPrice * item.quantity * 100) / 100,
    }));
    const subtotal = Math.round(items.reduce((sum, i) => sum + i.lineTotal, 0) * 100) / 100;

    const order: OrderResponseDto = {
      id: `o${this.counter}`,
      orderNumber: `ORD-2026-${this.counter}`,
      email: dto.email,
      status: 'PENDING_PAYMENT',
      subtotal,
      grandTotal: subtotal, // no tax/shipping calc in this slice — see report
      items,
      placedAt: new Date().toISOString(),
    };
    this.counter += 1;
    this.orders.push(order);
    return order;
  }

  async findById(id: string) {
    return this.orders.find((o) => o.id === id) ?? null;
  }

  async findAll() {
    // Most recent first — the natural default for an admin order queue.
    return [...this.orders].reverse();
  }

  async updateStatus(id: string, status: string) {
    const order = this.orders.find((o) => o.id === id);
    if (!order) return null;
    order.status = status;
    return order;
  }
}
