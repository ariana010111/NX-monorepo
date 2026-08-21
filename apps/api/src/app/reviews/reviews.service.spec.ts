import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsRepository } from './reviews.repository';
import { ProductsService } from '../catalog/products.service';
import { OrdersService } from '../orders/orders.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewsRepo: jest.Mocked<ReviewsRepository>;
  let productsService: jest.Mocked<ProductsService>;
  let ordersService: jest.Mocked<OrdersService>;

  const authUser = { userId: 'u1', email: 'buyer@example.com', roles: ['CUSTOMER'] };
  const product = { id: 'p1', variants: [{ id: 'v1' }, { id: 'v2' }] } as any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: ReviewsRepository,
          useValue: { findApprovedByProductId: jest.fn(), findAll: jest.fn(), findByUserAndProduct: jest.fn(), create: jest.fn(), updateStatus: jest.fn() },
        },
        { provide: ProductsService, useValue: { getById: jest.fn() } },
        { provide: OrdersService, useValue: { listForUser: jest.fn() } },
      ],
    }).compile();

    service = module.get(ReviewsService);
    reviewsRepo = module.get(ReviewsRepository);
    productsService = module.get(ProductsService);
    ordersService = module.get(OrdersService);
  });

  it('marks a review verified when the user has a PAID order containing that product\'s variant', async () => {
    productsService.getById.mockResolvedValue(product);
    reviewsRepo.findByUserAndProduct.mockResolvedValue(null);
    ordersService.listForUser.mockResolvedValue([
      { status: 'PAID', items: [{ variantId: 'v1' }] } as any,
    ]);
    reviewsRepo.create.mockImplementation(async (r) => ({ ...r, id: 'test-review', authorName: 'Test User', createdAt: new Date().toISOString() }));

    const result = await service.create({ productId: 'p1', rating: 5 }, authUser);
    expect(result.isVerifiedPurchase).toBe(true);
  });

  it('does NOT mark verified when the user\'s order is still PENDING_PAYMENT', async () => {
    productsService.getById.mockResolvedValue(product);
    reviewsRepo.findByUserAndProduct.mockResolvedValue(null);
    ordersService.listForUser.mockResolvedValue([
      { status: 'PENDING_PAYMENT', items: [{ variantId: 'v1' }] } as any,
    ]);
    reviewsRepo.create.mockImplementation(async (r) => ({ ...r, id: 'test-review', authorName: 'Test User', createdAt: new Date().toISOString() }));

    const result = await service.create({ productId: 'p1', rating: 5 }, authUser);
    expect(result.isVerifiedPurchase).toBe(false);
  });

  it('does NOT mark verified for an order that belongs to a DIFFERENT product', async () => {
    productsService.getById.mockResolvedValue(product); // variants v1, v2
    reviewsRepo.findByUserAndProduct.mockResolvedValue(null);
    ordersService.listForUser.mockResolvedValue([
      { status: 'PAID', items: [{ variantId: 'v99-unrelated-product' }] } as any,
    ]);
    reviewsRepo.create.mockImplementation(async (r) => ({ ...r, id: 'test-review', authorName: 'Test User', createdAt: new Date().toISOString() }));

    const result = await service.create({ productId: 'p1', rating: 5 }, authUser);
    expect(result.isVerifiedPurchase).toBe(false);
  });

  it('rejects a second review from the same user for the same product', async () => {
    productsService.getById.mockResolvedValue(product);
    reviewsRepo.findByUserAndProduct.mockResolvedValue({ id: 'existing-review' } as any);

    await expect(service.create({ productId: 'p1', rating: 5 }, authUser)).rejects.toThrow(ConflictException);
    expect(reviewsRepo.create).not.toHaveBeenCalled();
  });

  it('every new review starts PENDING regardless of verified-purchase status', async () => {
    productsService.getById.mockResolvedValue(product);
    reviewsRepo.findByUserAndProduct.mockResolvedValue(null);
    ordersService.listForUser.mockResolvedValue([{ status: 'PAID', items: [{ variantId: 'v1' }] } as any]);
    reviewsRepo.create.mockImplementation(async (r) => ({ ...r, id: 'test-review', authorName: 'Test User', createdAt: new Date().toISOString() }));

    const result = await service.create({ productId: 'p1', rating: 5 }, authUser);
    expect(result.status).toBe('PENDING');
  });
});
