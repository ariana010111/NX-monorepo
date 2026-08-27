import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { InventoryService } from '../inventory/inventory.service';
import { CouponsService } from '../coupons/coupons.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepo: OrdersRepository,
    private readonly inventoryService: InventoryService,
    private readonly couponsService: CouponsService,
  ) {}

  async create(dto: CreateOrderDto, userId?: string) {
    // Reserve stock BEFORE creating the order — if any line item is out of
    // stock, InsufficientStockException propagates and no order is created.
    await this.inventoryService.reserveForOrder(
      dto.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
    );

    let discountTotal = 0;
    let appliedCouponCode: string | undefined;
    if (dto.couponCode) {
      // Re-validate server-side even though the storefront already called
      // GET /coupons/:code/validate to preview this — never trust a
      // discount amount the client merely displayed back to it.
      const subtotal = dto.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const result = await this.couponsService.validate(dto.couponCode, subtotal);
      discountTotal = result.discountAmount;
      appliedCouponCode = result.code;
    }

    return this.ordersRepo.create({ dto, userId, discountTotal, couponCode: appliedCouponCode });
  }

  async getById(id: string) {
    const order = await this.ordersRepo.findById(id);
    if (!order) throw new NotFoundException(`Order "${id}" not found`);
    return order;
  }

  async getByIdForActor(id: string, user: AuthenticatedUser) {
    const order = await this.getById(id);
    const isAdmin = user.roles.some((role) => ['SUPERADMIN', 'SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(role));
    if (!isAdmin && order.userId !== user.userId) throw new ForbiddenException('You cannot access this order');
    return order;
  }

  list() {
    return this.ordersRepo.findAll();
  }

  listForUser(userId: string) {
    return this.ordersRepo.findByUserId(userId);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const updated = await this.ordersRepo.updateStatus(id, dto.status);
    if (!updated) throw new NotFoundException(`Order "${id}" not found`);
    return updated;
  }
}
