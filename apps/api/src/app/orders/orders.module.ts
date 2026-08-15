import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository, InMemoryOrdersRepository } from './orders.repository';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [OrdersController],
  providers: [OrdersService, { provide: OrdersRepository, useClass: InMemoryOrdersRepository }],
  exports: [OrdersService],
})
export class OrdersModule {}
