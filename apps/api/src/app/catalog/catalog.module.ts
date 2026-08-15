import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsRepository, InMemoryProductsRepository } from './products.repository';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, { provide: ProductsRepository, useClass: InMemoryProductsRepository }],
  exports: [ProductsService],
})
export class CatalogModule {}
