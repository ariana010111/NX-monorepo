import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PayOrderDto {
  // Placeholder for real gateway fields (e.g. a Stripe PaymentMethod id)
  // once a real provider replaces MockPaymentProvider. Optional and
  // unused today, kept so the endpoint shape doesn't need to change later.
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethodToken?: string;
}
