import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CouponsRepository } from './coupons.repository';
import { CouponRecord } from './coupon.types';

describe('CouponsService', () => {
  let service: CouponsService;
  let couponsRepo: jest.Mocked<CouponsRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CouponsService, { provide: CouponsRepository, useValue: { findByCode: jest.fn() } }],
    }).compile();

    service = module.get(CouponsService);
    couponsRepo = module.get(CouponsRepository);
  });

  it('throws NotFoundException for a nonexistent code', async () => {
    couponsRepo.findByCode.mockResolvedValue(null);
    await expect(service.validate('NOPE', 100)).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException for an inactive coupon', async () => {
    couponsRepo.findByCode.mockResolvedValue({ id: '1', code: 'X', type: 'PERCENTAGE', value: 10, isActive: false });
    await expect(service.validate('X', 100)).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for an expired coupon', async () => {
    couponsRepo.findByCode.mockResolvedValue({
      id: '1', code: 'X', type: 'PERCENTAGE', value: 10, isActive: true, expiresAt: '2020-01-01T00:00:00.000Z',
    });
    await expect(service.validate('X', 100)).rejects.toThrow('expired');
  });

  it('throws BadRequestException when subtotal is below the minimum order amount', async () => {
    couponsRepo.findByCode.mockResolvedValue({
      id: '1', code: 'X', type: 'FIXED_AMOUNT', value: 5, minOrderAmount: 30, isActive: true,
    });
    await expect(service.validate('X', 10)).rejects.toThrow('minimum order of 30');
  });

  it('computes a PERCENTAGE discount correctly', async () => {
    couponsRepo.findByCode.mockResolvedValue({ id: '1', code: 'X', type: 'PERCENTAGE', value: 10, isActive: true });
    const result = await service.validate('X', 100);
    expect(result.discountAmount).toBe(10);
  });

  it('computes a FIXED_AMOUNT discount correctly', async () => {
    couponsRepo.findByCode.mockResolvedValue({ id: '1', code: 'X', type: 'FIXED_AMOUNT', value: 15, isActive: true });
    const result = await service.validate('X', 100);
    expect(result.discountAmount).toBe(15);
  });

  it('caps a PERCENTAGE discount at maxDiscountAmount', async () => {
    couponsRepo.findByCode.mockResolvedValue({
      id: '1', code: 'X', type: 'PERCENTAGE', value: 50, maxDiscountAmount: 20, isActive: true,
    });
    const result = await service.validate('X', 100); // 50% would be 50, capped to 20
    expect(result.discountAmount).toBe(20);
  });

  it('never discounts more than the subtotal itself', async () => {
    couponsRepo.findByCode.mockResolvedValue({ id: '1', code: 'X', type: 'FIXED_AMOUNT', value: 50, isActive: true });
    const result = await service.validate('X', 10); // $50 off a $10 order
    expect(result.discountAmount).toBe(10); // never negative, never more than the order itself
  });

  it('returns the coupon code from the record, normalized, regardless of input casing', async () => {
    const record: CouponRecord = { id: '1', code: 'WELCOME10', type: 'PERCENTAGE', value: 10, isActive: true };
    couponsRepo.findByCode.mockResolvedValue(record);
    const result = await service.validate('welcome10', 100);
    expect(result.code).toBe('WELCOME10');
  });
});
