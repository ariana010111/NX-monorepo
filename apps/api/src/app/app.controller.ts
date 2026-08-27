import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Permissions, Permission } from './auth/permissions';
import { Roles } from './auth/decorators/roles.decorator';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly prisma: PrismaService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Roles('SUPERADMIN', 'SUPER_ADMIN', 'ADMIN')
  @Permissions(Permission.AnalyticsRead)
  @Get('analytics')
  async analytics() {
    const [products, orders, users, revenue] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.order.count(),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.order.aggregate({ _sum: { grandTotal: true }, where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } } }),
    ]);
    return { products, orders, users, revenue: Number(revenue._sum.grandTotal ?? 0) };
  }
}
