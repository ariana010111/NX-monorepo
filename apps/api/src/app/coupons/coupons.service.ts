import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CouponsRepository } from './coupons.repository';

@Injectable()
export class CouponsService {
  constructor(private readonly couponsRepo: CouponsRepository) {}

  /**
   * Throws with a specific, user-facing reason on any invalid case rather
   * than a generic "invalid coupon" — checkout can show the real reason
   * (expired vs. minimum not met vs. not found) instead of guessing.
   */
  async validate(code: string, subtotal: number): Promise<{ code: string; discountAmount: number }> {
    const coupon = await this.couponsRepo.findByCode(code);
    if (!coupon) throw new NotFoundException(`Coupon "${code}" not found`);
    if (!coupon.isActive) throw new BadRequestException(`Coupon "${code}" is no longer active`);
    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
      throw new BadRequestException(`Coupon "${code}" has expired`);
    }
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      throw new BadRequestException(`Coupon "${code}" requires a minimum order of ${coupon.minOrderAmount}`);
    }

    let discountAmount =
      coupon.type === 'PERCENTAGE' ? Math.round(subtotal * (coupon.value / 100) * 100) / 100 : coupon.value;

    if (coupon.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
    // A discount can never exceed the subtotal itself (e.g. a flat $5 off
    // a $3 order shouldn't produce a negative total).
    discountAmount = Math.min(discountAmount, subtotal);

    return { code: coupon.code, discountAmount };
  }
}
