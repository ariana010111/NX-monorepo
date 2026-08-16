import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { InventoryService } from '../inventory/inventory.service';
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

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: OrdersRepository, useValue: { create: jest.fn(), findById: jest.fn(), findAll: jest.fn(), updateStatus: jest.fn() } },
        { provide: InventoryService, useValue: { reserveForOrder: jest.fn() } },
      ],
    }).compile();

    service = module.get(OrdersService);
    ordersRepo = module.get(OrdersRepository);
    inventoryService = module.get(InventoryService);
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
