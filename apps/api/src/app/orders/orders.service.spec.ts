import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { InventoryService } from '../inventory/inventory.service';
import { CouponsService } from '../coupons/coupons.service';
import { InsufficientStockException } from '../inventory/insufficient-stock.exception';

const sampleOrderInput = {
  email: 'customer@example.com',
  shippingAddress: { fullName: 'A B', line1: '1 Main St', city: 'X', postalCode: '00000', country: 'US' },
  items: [{ variantId: 'v1', productName: 'Lipstick', variantLabel: 'Rosy Pink', unitPrice: 24, quantity: 2 }],
};

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepo: jest.Mocked<OrdersRepository>;
  let inventoryService: jest.Mocked<InventoryService>;
  let couponsService: jest.Mocked<CouponsService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: OrdersRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            findByUserId: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
        { provide: InventoryService, useValue: { reserveForOrder: jest.fn() } },
        { provide: CouponsService, useValue: { validate: jest.fn() } },
      ],
    }).compile();

    service = module.get(OrdersService);
    ordersRepo = module.get(OrdersRepository);
    inventoryService = module.get(InventoryService);
    couponsService = module.get(CouponsService);
  });

  describe('create', () => {
    it('reserves inventory BEFORE creating the order', async () => {
      const callOrder: string[] = [];
      inventoryService.reserveForOrder.mockImplementation(async () => {
        callOrder.push('reserve');
      });
      ordersRepo.create.mockImplementation(async () => {
        callOrder.push('create');
        return {} as any;
      });

      await service.create(sampleOrderInput);

      expect(callOrder).toEqual(['reserve', 'create']);
      expect(inventoryService.reserveForOrder).toHaveBeenCalledWith([{ variantId: 'v1', quantity: 2 }]);
    });

    it('does NOT create an order when inventory reservation fails', async () => {
      inventoryService.reserveForOrder.mockRejectedValue(new InsufficientStockException('v1', 2, 0));

      await expect(service.create(sampleOrderInput)).rejects.toThrow(InsufficientStockException);
      expect(ordersRepo.create).not.toHaveBeenCalled();
    });

    it('re-validates a coupon server-side (never trusts a client-supplied discount) and passes it through', async () => {
      inventoryService.reserveForOrder.mockResolvedValue(undefined);
      couponsService.validate.mockResolvedValue({ code: 'WELCOME10', discountAmount: 4.8 }); // 10% of 48
      ordersRepo.create.mockResolvedValue({} as any);

      await service.create({ ...sampleOrderInput, couponCode: 'welcome10' });

      // Validated against the REAL computed subtotal (48 = 24 * 2), not
      // anything the caller could have supplied directly.
      expect(couponsService.validate).toHaveBeenCalledWith('welcome10', 48);
      expect(ordersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ discountTotal: 4.8, couponCode: 'WELCOME10' }),
      );
    });

    it('propagates a coupon validation failure and does not create the order', async () => {
      inventoryService.reserveForOrder.mockResolvedValue(undefined);
      couponsService.validate.mockRejectedValue(new Error('Coupon "BADCODE" not found'));

      await expect(service.create({ ...sampleOrderInput, couponCode: 'BADCODE' })).rejects.toThrow(
        'Coupon "BADCODE" not found',
      );
      expect(ordersRepo.create).not.toHaveBeenCalled();
    });

    it('passes zero discount and skips coupon validation entirely when no coupon is supplied', async () => {
      inventoryService.reserveForOrder.mockResolvedValue(undefined);
      ordersRepo.create.mockResolvedValue({} as any);

      await service.create(sampleOrderInput);

      expect(couponsService.validate).not.toHaveBeenCalled();
      expect(ordersRepo.create).toHaveBeenCalledWith(expect.objectContaining({ discountTotal: 0 }));
    });

    it('attaches the authenticated userId when provided, for order ownership', async () => {
      inventoryService.reserveForOrder.mockResolvedValue(undefined);
      ordersRepo.create.mockResolvedValue({} as any);

      await service.create(sampleOrderInput, 'user-123');

      expect(ordersRepo.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-123' }));
    });

    it('leaves userId undefined for a guest checkout', async () => {
      inventoryService.reserveForOrder.mockResolvedValue(undefined);
      ordersRepo.create.mockResolvedValue({} as any);

      await service.create(sampleOrderInput);

      expect(ordersRepo.create).toHaveBeenCalledWith(expect.objectContaining({ userId: undefined }));
    });
  });

  describe('listForUser', () => {
    it('delegates to the repository, scoped to the given userId only', async () => {
      ordersRepo.findByUserId.mockResolvedValue([]);
      await service.listForUser('user-123');
      expect(ordersRepo.findByUserId).toHaveBeenCalledWith('user-123');
    });
  });

  describe('getById', () => {
    it('throws NotFoundException for an unknown order', async () => {
      ordersRepo.findById.mockResolvedValue(null);
      await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('throws NotFoundException when updating an unknown order', async () => {
      ordersRepo.updateStatus.mockResolvedValue(null);
      await expect(service.updateStatus('nonexistent', { status: 'SHIPPED' })).rejects.toThrow(NotFoundException);
    });
  });
});
