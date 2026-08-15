import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryRepository, InMemoryInventoryRepository } from './inventory.repository';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, { provide: InventoryRepository, useClass: InMemoryInventoryRepository }],
  exports: [InventoryService], // exported so OrdersModule can inject it
})
export class InventoryModule {}
