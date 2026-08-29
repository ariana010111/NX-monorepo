import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsTrendsDto } from './dto/analytics-trends.dto';
import { TopProductsDto } from './dto/top-products.dto';
import { CustomerSegmentsDto } from './dto/customer-segments.dto';

const emptyTrends: AnalyticsTrendsDto = { days: [], totalVisits: 0, totalOrders: 0, totalRevenue: 0 };
const emptyTopProducts: TopProductsDto = { products: [] };
const emptySegments: CustomerSegmentsDto = { newCustomers: 0, returningCustomers: 0, customersWithOrders: 0 };

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let repo: jest.Mocked<AnalyticsRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: AnalyticsRepository,
          useValue: {
            getTrends: jest.fn(),
            getTopProducts: jest.fn(),
            getCustomerSegments: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AnalyticsService);
    repo = module.get(AnalyticsRepository);
  });

  describe('getTrends', () => {
    it('passes explicit from/to dates to the repository', async () => {
      repo.getTrends.mockResolvedValue(emptyTrends);
      await service.getTrends({ from: '2026-08-01', to: '2026-08-10' });
      expect(repo.getTrends).toHaveBeenCalledWith(new Date('2026-08-01'), new Date('2026-08-10'));
    });

    it('uses a 30-day default window when no query params are provided', async () => {
      repo.getTrends.mockResolvedValue(emptyTrends);
      const before = Date.now();
      await service.getTrends({});
      const [from, to] = (repo.getTrends as jest.Mock).mock.calls[0] as [Date, Date];
      const dayDiff = Math.round((to.getTime() - from.getTime()) / 86400000);
      expect(dayDiff).toBe(30);
      expect(to.getTime()).toBeGreaterThanOrEqual(before - 1000);
    });

    it('throws BadRequestException when from > to', async () => {
      await expect(service.getTrends({ from: '2026-08-10', to: '2026-08-01' })).rejects.toThrow(BadRequestException);
      expect(repo.getTrends).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for a range exceeding 366 days', async () => {
      await expect(service.getTrends({ from: '2025-01-01', to: '2026-02-02' })).rejects.toThrow(BadRequestException);
      expect(repo.getTrends).not.toHaveBeenCalled();
    });
  });

  describe('getTopProducts', () => {
    it('defaults to limit 10 when not provided', async () => {
      repo.getTopProducts.mockResolvedValue(emptyTopProducts);
      await service.getTopProducts({});
      expect(repo.getTopProducts).toHaveBeenCalledWith(10);
    });

    it('passes through an explicit limit', async () => {
      repo.getTopProducts.mockResolvedValue(emptyTopProducts);
      await service.getTopProducts({ limit: 25 });
      expect(repo.getTopProducts).toHaveBeenCalledWith(25);
    });
  });

  describe('getCustomerSegments', () => {
    it('delegates to the repository', async () => {
      repo.getCustomerSegments.mockResolvedValue(emptySegments);
      const result = await service.getCustomerSegments();
      expect(result).toBe(emptySegments);
      expect(repo.getCustomerSegments).toHaveBeenCalledTimes(1);
    });
  });
});
