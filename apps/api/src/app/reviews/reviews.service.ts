import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { ReviewsRepository } from './reviews.repository';
import { CreateReviewDto } from './dto/create-review.dto';
import { ProductsService } from '../catalog/products.service';
import { OrdersService } from '../orders/orders.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

// Order statuses that represent a real completed/in-flight purchase —
// PENDING_PAYMENT and CANCELLED/REFUNDED must never count toward
// "verified purchase," or an abandoned or refunded cart would still earn
// the badge.
const PURCHASE_CONFIRMED_STATUSES = new Set(['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']);

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepo: ReviewsRepository,
    private readonly productsService: ProductsService,
    private readonly ordersService: OrdersService,
  ) {}

  async listApprovedForProduct(productId: string) {
    return this.reviewsRepo.findApprovedByProductId(productId);
  }

  listAllForModeration() {
    return this.reviewsRepo.findAll();
  }

  async create(dto: CreateReviewDto, user: AuthenticatedUser) {
    // Confirms the product actually exists before anything else.
    const product = await this.productsService.getById(dto.productId);

    const existing = await this.reviewsRepo.findByUserAndProduct(user.userId, dto.productId);
    if (existing) throw new ConflictException('You have already reviewed this product');

    const isVerifiedPurchase = await this.checkVerifiedPurchase(user.userId, product.id, product.variants.map((v) => v.id));

    const review = {
      id: `rv${Date.now()}`,
      productId: dto.productId,
      userId: user.userId,
      authorName: `${user.email.split('@')[0]}`, // real Prisma version uses User.firstName + lastName initial
      rating: dto.rating,
      title: dto.title,
      body: dto.body,
      status: 'PENDING' as const,
      isVerifiedPurchase,
      createdAt: new Date().toISOString(),
    };
    return this.reviewsRepo.create(review);
  }

  async moderate(id: string, status: 'APPROVED' | 'REJECTED') {
    const updated = await this.reviewsRepo.updateStatus(id, status);
    if (!updated) throw new NotFoundException(`Review "${id}" not found`);
    return updated;
  }

  /**
   * A purchase counts only if: it belongs to this user, its status shows
   * real fulfillment (not still pending payment, not cancelled/refunded),
   * AND at least one line item's variant belongs to THIS product — buying
   * a different product from the same store must not earn a verified
   * badge on an unrelated review.
   */
  private async checkVerifiedPurchase(userId: string, _productId: string, productVariantIds: string[]) {
    const orders = await this.ordersService.listForUser(userId);
    return orders.some(
      (order) =>
        PURCHASE_CONFIRMED_STATUSES.has(order.status) &&
        order.items.some((item) => productVariantIds.includes(item.variantId)),
    );
  }
}
