import { Injectable, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepo: OrdersRepository) {}

  create(dto: CreateOrderDto) {
    return this.ordersRepo.create(dto);
  }

  async getById(id: string) {
    const order = await this.ordersRepo.findById(id);
    if (!order) throw new NotFoundException(`Order "${id}" not found`);
    return order;
  }
}
