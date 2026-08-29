import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerProfileResponseDto } from './dto/customer-profile-response.dto';
import { AdminCustomerSummaryDto } from './dto/admin-customer-summary.dto';
import { OrderResponseDto } from '../orders/dto/order-response.dto';

// ---------------------------------------------------------------------------
// Contract — the profile module depends on this abstract class, not the
// concrete Prisma implementation, keeping persistence swappable for tests.
// ---------------------------------------------------------------------------
export abstract class ProfileRepository {
  abstract findCustomerProfile(userId: string): Promise<CustomerProfileResponseDto | null>;
  abstract findAllCustomers(): Promise<AdminCustomerSummaryDto[]>;
  abstract findCustomerById(userId: string): Promise<CustomerProfileResponseDto | null>;
}

// ---------------------------------------------------------------------------
// Prisma implementation
// ---------------------------------------------------------------------------
@Injectable()
export class PrismaProfileRepository implements ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Shared include used for both self-serve profile and admin customer detail
  private readonly orderInclude = {
    orderitem: {
      include: {
        productvariant: {
          include: {
            variantattributevalue: { include: { attributevalue: true } },
            productimage: { where: { isPrimary: true }, take: 1 },
          },
        },
        product: true,
      },
    },
  } as const;

  private mapOrder(order: any): OrderResponseDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      email: order.email,
      userId: order.userId ?? undefined,
      status: order.status,
      currency: order.currency,
      subtotal: Number(order.subtotal),
      discountTotal: order.discountTotal ? Number(order.discountTotal) : undefined,
      couponCode: order.couponCode ?? undefined,
      grandTotal: Number(order.grandTotal),
      items: order.orderitem.map((item: any) => ({
        variantId: item.variantId,
        productName: item.productNameSnapshot,
        variantLabel: item.variantAttributesSnapshot
          ? Object.values(item.variantAttributesSnapshot as Record<string, string>).join(' / ')
          : item.variantSkuSnapshot,
        unitPrice: Number(item.unitPriceSnapshot),
        quantity: item.quantity,
        lineTotal: Number(item.lineTotal),
      })),
      placedAt: order.placedAt.toISOString(),
    };
  }

  private computeStats(orders: any[]): { orderCount: number; lifetimeSpend: number; lastOrderAt: string | null } {
    const orderCount = orders.length;
    const lifetimeSpend = orders.reduce((sum, o) => sum + Number(o.grandTotal), 0);
    const lastOrderAt =
      orderCount > 0
        ? orders
            .map((o) => o.placedAt as Date)
            .sort((a, b) => b.getTime() - a.getTime())[0]
            .toISOString()
        : null;
    return { orderCount, lifetimeSpend: Math.round(lifetimeSpend * 100) / 100, lastOrderAt };
  }

  async findCustomerProfile(userId: string): Promise<CustomerProfileResponseDto | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        order: {
          include: this.orderInclude,
          orderBy: { placedAt: 'desc' },
        },
      },
    });
    if (!user) return null;
    const stats = this.computeStats(user.order);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? null,
      createdAt: user.createdAt.toISOString(),
      ...stats,
      orders: user.order.map((o: any) => this.mapOrder(o)),
    };
  }

  async findAllCustomers(): Promise<AdminCustomerSummaryDto[]> {
    // Load all CUSTOMER-role users with their order aggregation.
    // Using raw subquery aggregation per Prisma convention for computed columns.
    const customerRoleUsers = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        userrole: { some: { role: { name: 'CUSTOMER' } } },
      },
      include: {
        order: { select: { grandTotal: true, placedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return customerRoleUsers.map((user) => {
      const stats = this.computeStats(user.order);
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? null,
        createdAt: user.createdAt.toISOString(),
        ...stats,
      };
    });
  }

  async findCustomerById(userId: string): Promise<CustomerProfileResponseDto | null> {
    return this.findCustomerProfile(userId);
  }
}
