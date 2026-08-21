import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryRepository, PrismaInventoryRepository } from './inventory.repository';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, { provide: InventoryRepository, useClass: PrismaInventoryRepository }],
  exports: [InventoryService], // exported so OrdersModule can inject it
})
export class InventoryModule {}
