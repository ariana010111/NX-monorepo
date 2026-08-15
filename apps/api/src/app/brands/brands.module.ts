import { Module } from '@nestjs/common';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { BrandsRepository, InMemoryBrandsRepository } from './brands.repository';

@Module({
  controllers: [BrandsController],
  providers: [BrandsService, { provide: BrandsRepository, useClass: InMemoryBrandsRepository }],
  exports: [BrandsService],
})
export class BrandsModule {}
