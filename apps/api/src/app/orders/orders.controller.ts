import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @Get()
  @ApiOkResponse({ type: OrderResponseDto, isArray: true })
  list() {
    return this.ordersService.list();
  }

  // Public: guest checkout is a stated requirement, so order creation
  // can't require a login. There's no user identity attached to orders
  // yet at all (see VALIDATION_REPORT.md) — attaching the authenticated
  // user when present, while still allowing guests, is the next step here.
  @Public()
  @Post()
  @ApiCreatedResponse({ type: OrderResponseDto })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  // Public for the same reason: a guest needs to reach their own order
  // confirmation page with no account. Real ownership/ verification (e.g.
  // requiring the order's email to match, or a signed confirmation link)
  // is a known gap — right now any order id is fetchable by anyone who
  // has it. Flagged in VALIDATION_REPORT.md as a pre-production blocker.
  @Public()
  @Get(':id')
  @ApiOkResponse({ type: OrderResponseDto })
  getById(@Param('id') id: string) {
    return this.ordersService.getById(id);
  }

  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOkResponse({ type: OrderResponseDto })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
