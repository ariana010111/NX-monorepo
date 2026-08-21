import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewResponseDto } from './dto/review-response.dto';

export abstract class ReviewsRepository {
  abstract findApprovedByProductId(productId: string): Promise<ReviewResponseDto[]>;
  abstract findAll(): Promise<ReviewResponseDto[]>;
  abstract findByUserAndProduct(userId: string, productId: string): Promise<ReviewResponseDto | null>;
  abstract create(review: Omit<ReviewResponseDto, 'id' | 'authorName' | 'createdAt'> & { authorName?: string }): Promise<ReviewResponseDto>;
  abstract updateStatus(id: string, status: 'APPROVED' | 'REJECTED'): Promise<ReviewResponseDto | null>;
}

/**
 * TEMPORARY in-memory implementation — same pattern as every other
 * repository. The real Prisma-backed version enforces the @@unique on
 * (productId, userId) from the approved schema at the DB level too, not
 * just in the service layer's pre-check (see ReviewsService.create).
 */
@Injectable()
export class PrismaReviewsRepository implements ReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}
  private map(review: any): ReviewResponseDto { return { id: review.id, productId: review.productId, userId: review.userId, authorName: `${review.user.firstName} ${review.user.lastName.charAt(0)}.`, rating: review.rating, title: review.title ?? undefined, body: review.body ?? undefined, status: review.status, isVerifiedPurchase: review.isVerifiedPurchase, createdAt: review.createdAt.toISOString() }; }
  private include = { user: true };
  async findApprovedByProductId(productId: string) { return (await this.prisma.review.findMany({ where: { productId, status: 'APPROVED', deletedAt: null }, include: this.include, orderBy: { createdAt: 'desc' } })).map((review) => this.map(review)); }
  async findAll() { return (await this.prisma.review.findMany({ where: { deletedAt: null }, include: this.include, orderBy: { createdAt: 'desc' } })).map((review) => this.map(review)); }
  async findByUserAndProduct(userId: string, productId: string) { const review = await this.prisma.review.findUnique({ where: { productId_userId: { productId, userId } }, include: this.include }); return review ? this.map(review) : null; }
  async create(review: Omit<ReviewResponseDto, 'id' | 'authorName' | 'createdAt'> & { authorName?: string }) { return this.map(await this.prisma.review.create({ data: { productId: review.productId, userId: review.userId, rating: review.rating, title: review.title, body: review.body, status: review.status as any, isVerifiedPurchase: review.isVerifiedPurchase }, include: this.include })); }
  async updateStatus(id: string, status: 'APPROVED' | 'REJECTED') { const result = await this.prisma.review.updateMany({ where: { id, deletedAt: null }, data: { status } }); if (!result.count) return null; return this.map(await this.prisma.review.findUniqueOrThrow({ where: { id }, include: this.include })); }
}
