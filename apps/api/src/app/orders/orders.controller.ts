import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permission, Permissions } from '../auth/permissions';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @Permissions(Permission.OrdersRead)
  @ApiBearerAuth()
  @Get()
  @ApiOkResponse({ type: OrderResponseDto, isArray: true })
  list() {
    return this.ordersService.list();
  }

  // Real ownership: requires a valid token (not @Public()), returns only
  // orders belonging to the authenticated user. This is the endpoint that
  // closes the "no order history" gap — a logged-in customer's own orders,
  // filtered server-side, not just "trust whatever the client asks for."
  @ApiBearerAuth()
  @Get('me')
  @ApiOkResponse({ type: OrderResponseDto, isArray: true })
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.listForUser(user.userId);
  }

  // Public + OptionalJwtAuthGuard: guest checkout must keep working, but a
  // logged-in customer's order gets their userId attached automatically —
  // best of both, rather than forcing a choice between "require login" and
  // "never track ownership."
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  @ApiCreatedResponse({ type: OrderResponseDto })
  create(@CurrentUser() user: AuthenticatedUser | undefined, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto, user?.userId);
  }

  // Authenticated customers may retrieve their own order; admin roles may
  // retrieve any order. Ownership is enforced in OrdersService.
  @Get(':id')
  @ApiOkResponse({ type: OrderResponseDto })
  getById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.getByIdForActor(id, user);
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @Permissions(Permission.OrdersWrite)
  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOkResponse({ type: OrderResponseDto })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
