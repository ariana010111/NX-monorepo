import { Injectable, inject } from '@angular/core';
import { BeautyPlatformAPIService, CreateReviewDto } from '@beauty-platform-validated/api-client';

@Injectable({ providedIn: 'root' })
export class ReviewsApiService {
  private readonly generated = inject(BeautyPlatformAPIService);

  listForProduct(productId: string) {
    return this.generated.reviewsControllerListForProduct(productId);
  }
  create(dto: CreateReviewDto) {
    return this.generated.reviewsControllerCreate(dto);
  }
}
