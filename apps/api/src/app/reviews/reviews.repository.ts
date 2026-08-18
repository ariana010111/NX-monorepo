import { Injectable } from '@nestjs/common';
import { ReviewResponseDto } from './dto/review-response.dto';

export abstract class ReviewsRepository {
  abstract findApprovedByProductId(productId: string): Promise<ReviewResponseDto[]>;
  abstract findAll(): Promise<ReviewResponseDto[]>;
  abstract findByUserAndProduct(userId: string, productId: string): Promise<ReviewResponseDto | null>;
  abstract create(review: ReviewResponseDto): Promise<ReviewResponseDto>;
  abstract updateStatus(id: string, status: 'APPROVED' | 'REJECTED'): Promise<ReviewResponseDto | null>;
}

/**
 * TEMPORARY in-memory implementation — same pattern as every other
 * repository. The real Prisma-backed version enforces the @@unique on
 * (productId, userId) from the approved schema at the DB level too, not
 * just in the service layer's pre-check (see ReviewsService.create).
 */
@Injectable()
export class InMemoryReviewsRepository implements ReviewsRepository {
  private reviews: ReviewResponseDto[] = [];

  async findApprovedByProductId(productId: string) {
    return this.reviews.filter((r) => r.productId === productId && r.status === 'APPROVED').reverse();
  }

  async findAll() {
    return [...this.reviews].reverse();
  }

  async findByUserAndProduct(userId: string, productId: string) {
    return this.reviews.find((r) => r.userId === userId && r.productId === productId) ?? null;
  }

  async create(review: ReviewResponseDto) {
    this.reviews.push(review);
    return review;
  }

  async updateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const review = this.reviews.find((r) => r.id === id);
    if (!review) return null;
    review.status = status;
    return review;
  }
}
