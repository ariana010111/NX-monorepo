import { Injectable, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepo: OrdersRepository,
    private readonly inventoryService: InventoryService,
  ) {}

  async create(dto: CreateOrderDto) {
    // Reserve stock BEFORE creating the order — if any line item is out of
    // stock, InsufficientStockException propagates and no order is created.
    // See InventoryService.reserveForOrder for the all-or-nothing semantics.
    await this.inventoryService.reserveForOrder(
      dto.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
    );
    return this.ordersRepo.create(dto);
  }

  async getById(id: string) {
    const order = await this.ordersRepo.findById(id);
    if (!order) throw new NotFoundException(`Order "${id}" not found`);
    return order;
  }
}
