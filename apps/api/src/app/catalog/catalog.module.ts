import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsRepository, PrismaProductsRepository } from './products.repository';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [ProductsController],
  providers: [ProductsService, { provide: ProductsRepository, useClass: PrismaProductsRepository }],
  exports: [ProductsService],
})
export class CatalogModule {}
