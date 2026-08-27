import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

const databaseUrl = new URL(process.env.DATABASE_URL!);
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseUrl.pathname.slice(1),
    connectionLimit: 5,
  }),
});

async function main() {
  const superAdminEmail = process.env.SUPERADMIN_EMAIL ?? 'admin@beauty-platform.local';
  const defaultPassword = process.env.NODE_ENV === 'production' ? undefined : 'ChangeMe123!';
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD ?? defaultPassword;
  if (!superAdminPassword) throw new Error('SUPERADMIN_PASSWORD must be set in production');
  const seller = await prisma.seller.upsert({
    where: { slug: 'beauty-platform' },
    update: {},
    create: { id: randomUUID(), name: 'Beauty Platform', slug: 'beauty-platform', updatedAt: new Date() },
  });

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPERADMIN' },
    update: { description: 'Unrestricted platform administrator', isSystem: true },
    create: { id: randomUUID(), name: 'SUPERADMIN', description: 'Unrestricted platform administrator', isSystem: true, updatedAt: new Date() },
  });
  const adminRole = await prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { id: randomUUID(), name: 'ADMIN', description: 'Admin panel administration', updatedAt: new Date() } });
  const staffRole = await prisma.role.upsert({ where: { name: 'STAFF' }, update: {}, create: { id: randomUUID(), name: 'STAFF', description: 'Catalog and order operations', updatedAt: new Date() } });
  const customerRole = await prisma.role.upsert({ where: { name: 'CUSTOMER' }, update: {}, create: { id: randomUUID(), name: 'CUSTOMER', description: 'Storefront customer', updatedAt: new Date() } });

  const permissionsByRole: Record<string, string[]> = {
    SUPERADMIN: ['products:read', 'products:write', 'categories:read', 'categories:write', 'brands:read', 'brands:write', 'orders:read', 'orders:write', 'users:read', 'users:create:staff', 'users:create:customer', 'users:create:admin', 'analytics:read', 'roles:manage'],
    ADMIN: ['products:read', 'products:write', 'categories:read', 'categories:write', 'brands:read', 'brands:write', 'orders:read', 'orders:write', 'users:read', 'users:create:staff', 'users:create:customer', 'analytics:read'],
    STAFF: ['products:read', 'products:write', 'categories:read', 'categories:write', 'brands:read', 'brands:write', 'orders:read', 'orders:write', 'users:read', 'users:create:staff', 'users:create:customer'],
    CUSTOMER: [],
  };
  const roles = { SUPERADMIN: superAdminRole, ADMIN: adminRole, STAFF: staffRole, CUSTOMER: customerRole };
  for (const name of Object.values(permissionsByRole).flat()) {
    const permission = await prisma.permission.upsert({ where: { name }, update: {}, create: { id: randomUUID(), name } });
    for (const [roleName, permissionNames] of Object.entries(permissionsByRole)) {
      if (permissionNames.includes(name)) await prisma.rolepermission.upsert({ where: { roleId_permissionId: { roleId: roles[roleName as keyof typeof roles].id, permissionId: permission.id } }, update: {}, create: { roleId: roles[roleName as keyof typeof roles].id, permissionId: permission.id } });
    }
  }

  const admin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: { isActive: true, deletedAt: null, ...(process.env.NODE_ENV !== 'production' || process.env.SUPERADMIN_PASSWORD ? { passwordHash: await bcrypt.hash(superAdminPassword, 12) } : {}) },
    create: {
      id: randomUUID(),
      email: superAdminEmail,
      passwordHash: await bcrypt.hash(superAdminPassword, 12),
      firstName: 'Platform',
      lastName: 'Admin',
      updatedAt: new Date(),
    },
  });
  await prisma.userrole.deleteMany({ where: { userId: admin.id } });
  await prisma.userrole.create({ data: { userId: admin.id, roleId: superAdminRole.id } });

  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: { id: randomUUID(), code: 'WELCOME10', type: 'PERCENTAGE', value: 10, updatedAt: new Date() },
  });
  await prisma.coupon.upsert({
    where: { code: 'FLAT5' },
    update: {},
    create: { id: randomUUID(), code: 'FLAT5', type: 'FIXED_AMOUNT', value: 5, minOrderAmount: 30, updatedAt: new Date() },
  });
  await prisma.coupon.upsert({
    where: { code: 'EXPIRED10' },
    update: {},
    create: { id: randomUUID(), code: 'EXPIRED10', type: 'PERCENTAGE', value: 10, endsAt: new Date('2020-01-01'), updatedAt: new Date() },
  });

  await prisma.warehouse.upsert({
    where: { sellerId_code: { sellerId: seller.id, code: 'MAIN' } },
    update: {},
    create: {
      id: randomUUID(),
      sellerId: seller.id,
      name: 'Main Warehouse',
      code: 'MAIN',
      line1: '1 Beauty Way',
      city: 'Montreal',
      country: 'CA',
      updatedAt: new Date(),
    },
  });
}

main()
  .finally(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
