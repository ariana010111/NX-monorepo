import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './inventory.repository';
import { InsufficientStockException } from './insufficient-stock.exception';

function makeItem(overrides: Partial<{ variantId: string; quantityOnHand: number; quantityReserved: number; quantityAvailable: number }> = {}) {
  return {
    variantId: 'v1',
    productName: 'Test Product',
    variantLabel: 'Test Variant',
    quantityOnHand: 10,
    quantityReserved: 0,
    quantityAvailable: 10,
    lowStockThreshold: 5,
    ...overrides,
  };
}

describe('InventoryService', () => {
  let service: InventoryService;
  let repo: jest.Mocked<InventoryRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: InventoryRepository,
          useValue: { findAll: jest.fn(), findByVariantId: jest.fn(), adjustOnHand: jest.fn(), reserve: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(InventoryService);
    repo = module.get(InventoryRepository);
  });

  describe('getByVariantId', () => {
    it('throws NotFoundException for an unknown variant', async () => {
      repo.findByVariantId.mockResolvedValue(null);
      await expect(service.getByVariantId('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('reserveForOrder', () => {
    it('reserves stock for every line item when all have sufficient availability', async () => {
      repo.findByVariantId.mockImplementation(async (id) => makeItem({ variantId: id, quantityOnHand: 10, quantityAvailable: 10 }));

      await service.reserveForOrder([
        { variantId: 'v1', quantity: 3 },
        { variantId: 'v2', quantity: 2 },
      ]);

      expect(repo.reserve).toHaveBeenCalledWith('v1', 3);
      expect(repo.reserve).toHaveBeenCalledWith('v2', 2);
      expect(repo.reserve).toHaveBeenCalledTimes(2);
    });

    it('rejects the whole order when ANY line item lacks stock — all or nothing', async () => {
      repo.findByVariantId.mockImplementation(async (id) => {
        if (id === 'v1') return makeItem({ variantId: 'v1', quantityAvailable: 10 });
        return makeItem({ variantId: 'v2', quantityAvailable: 1 }); // insufficient for quantity 2
      });

      await expect(
        service.reserveForOrder([
          { variantId: 'v1', quantity: 3 },
          { variantId: 'v2', quantity: 2 },
        ]),
      ).rejects.toThrow(InsufficientStockException);

      // The critical invariant: v1 must NOT have been reserved either,
      // even though it had enough stock — a rejected order must leave
      // zero partial reservations behind.
      expect(repo.reserve).not.toHaveBeenCalled();
    });

    it('rejects when requested quantity exactly exceeds availability by one', async () => {
      repo.findByVariantId.mockResolvedValue(makeItem({ quantityAvailable: 3 }));
      await expect(service.reserveForOrder([{ variantId: 'v1', quantity: 4 }])).rejects.toThrow(
        InsufficientStockException,
      );
    });

    it('succeeds at the exact boundary — requesting exactly what is available', async () => {
      repo.findByVariantId.mockResolvedValue(makeItem({ quantityAvailable: 3 }));
      await expect(service.reserveForOrder([{ variantId: 'v1', quantity: 3 }])).resolves.toBeUndefined();
      expect(repo.reserve).toHaveBeenCalledWith('v1', 3);
    });
  });
});
