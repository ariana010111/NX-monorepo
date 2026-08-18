import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { ValidateCouponResponseDto } from './dto/validate-coupon-response.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // Public — a customer must be able to preview a discount before login/
  // checkout completes. The actual application of the coupon is re-validated
  // server-side again during order creation (OrdersService), so nothing
  // trusts a value the client merely displayed.
  @Public()
  @Get(':code/validate')
  @ApiOkResponse({ type: ValidateCouponResponseDto })
  @ApiQuery({ name: 'subtotal', required: true, type: Number })
  validate(@Param('code') code: string, @Query('subtotal') subtotal: number) {
    return this.couponsService.validate(code, Number(subtotal));
  }
}
