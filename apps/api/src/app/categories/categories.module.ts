import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesRepository, InMemoryCategoriesRepository } from './categories.repository';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, { provide: CategoriesRepository, useClass: InMemoryCategoriesRepository }],
  exports: [CategoriesService],
})
export class CategoriesModule {}
