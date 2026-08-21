import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CouponRecord } from './coupon.types';

export abstract class CouponsRepository {
  abstract findByCode(code: string): Promise<CouponRecord | null>;
}

/**
 * Reads active coupons from Prisma. Seed data is created by prisma/seed.ts.
 * checkout flow has something real to validate against:
 *   WELCOME10  — 10% off, no minimum
 *   FLAT5      — $5 off orders of $30+
 * The real Prisma-backed version reads the Coupon table from the approved
 * schema (which also supports product/category scoping and per-customer
 * usage limits via CouponUsage — neither is implemented in this in-memory
 * stub; see CouponsService for what's actually enforced here).
 */
@Injectable()
export class PrismaCouponsRepository implements CouponsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByCode(code: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) return null;
    return { id: coupon.id, code: coupon.code, type: coupon.type, value: Number(coupon.value), minOrderAmount: coupon.minOrderAmount == null ? undefined : Number(coupon.minOrderAmount), maxDiscountAmount: coupon.maxDiscountAmount == null ? undefined : Number(coupon.maxDiscountAmount), isActive: coupon.isActive, expiresAt: coupon.endsAt?.toISOString() } satisfies CouponRecord;
  }
}
