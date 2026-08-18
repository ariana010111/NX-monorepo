import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ReviewsRepository, InMemoryReviewsRepository } from './reviews.repository';
import { CatalogModule } from '../catalog/catalog.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [CatalogModule, OrdersModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, { provide: ReviewsRepository, useClass: InMemoryReviewsRepository }],
  exports: [ReviewsService],
})
export class ReviewsModule {}
