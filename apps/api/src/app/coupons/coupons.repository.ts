import { Injectable } from '@nestjs/common';
import { CouponRecord } from './coupon.types';

export abstract class CouponsRepository {
  abstract findByCode(code: string): Promise<CouponRecord | null>;
}

/**
 * TEMPORARY in-memory implementation. Seeded with two demo coupons so the
 * checkout flow has something real to validate against:
 *   WELCOME10  — 10% off, no minimum
 *   FLAT5      — $5 off orders of $30+
 * The real Prisma-backed version reads the Coupon table from the approved
 * schema (which also supports product/category scoping and per-customer
 * usage limits via CouponUsage — neither is implemented in this in-memory
 * stub; see CouponsService for what's actually enforced here).
 */
@Injectable()
export class InMemoryCouponsRepository implements CouponsRepository {
  private coupons: CouponRecord[] = [
    { id: 'cp1', code: 'WELCOME10', type: 'PERCENTAGE', value: 10, isActive: true },
    { id: 'cp2', code: 'FLAT5', type: 'FIXED_AMOUNT', value: 5, minOrderAmount: 30, isActive: true },
    {
      id: 'cp3',
      code: 'EXPIRED10',
      type: 'PERCENTAGE',
      value: 10,
      isActive: true,
      expiresAt: '2020-01-01T00:00:00.000Z', // seeded expired, for testing the expiry path
    },
  ];

  async findByCode(code: string) {
    return this.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase()) ?? null;
  }
}
