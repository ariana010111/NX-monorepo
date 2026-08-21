export interface CouponRecord {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number; // percentage points (0-100) or a flat currency amount, per `type`
  minOrderAmount?: number;
  maxDiscountAmount?: number; // caps a PERCENTAGE discount
  isActive: boolean;
  expiresAt?: string; // ISO date
}
