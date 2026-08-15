import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository, InMemoryOrdersRepository } from './orders.repository';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, { provide: OrdersRepository, useClass: InMemoryOrdersRepository }],
  exports: [OrdersService],
})
export class OrdersModule {}
