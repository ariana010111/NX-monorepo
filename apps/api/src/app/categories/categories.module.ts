import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesRepository, PrismaCategoriesRepository } from './categories.repository';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, { provide: CategoriesRepository, useClass: PrismaCategoriesRepository }],
  exports: [CategoriesService],
})
export class CategoriesModule {}
