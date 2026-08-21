import { Module } from '@nestjs/common';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { BrandsRepository, PrismaBrandsRepository } from './brands.repository';

@Module({
  controllers: [BrandsController],
  providers: [BrandsService, { provide: BrandsRepository, useClass: PrismaBrandsRepository }],
  exports: [BrandsService],
})
export class BrandsModule {}
