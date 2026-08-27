import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Public + OptionalJwtAuthGuard: guest checkout must be able to pay for
  // its own order with no account, same reasoning as order creation
  // itself. No ownership check here yet — same documented gap as order
  // lookup by id (see VALIDATION_REPORT.md).
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('orders/:orderId/pay')
  @ApiCreatedResponse({ type: PaymentResponseDto })
  pay(@Param('orderId') orderId: string) {
    return this.paymentsService.payForOrder(orderId);
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiBearerAuth()
  @Get('orders/:orderId')
  @ApiOkResponse({ type: PaymentResponseDto, isArray: true })
  listForOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.listForOrder(orderId);
  }
}
