import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository, PrismaOrdersRepository } from './orders.repository';
import { InventoryModule } from '../inventory/inventory.module';
import { CouponsModule } from '../coupons/coupons.module';

@Module({
  imports: [InventoryModule, CouponsModule],
  controllers: [OrdersController],
  providers: [OrdersService, { provide: OrdersRepository, useClass: PrismaOrdersRepository }],
  exports: [OrdersService],
})
export class OrdersModule {}
