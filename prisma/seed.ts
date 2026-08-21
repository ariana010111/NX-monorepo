import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcryptjs';

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
  const seller = await prisma.seller.upsert({
    where: { slug: 'beauty-platform' },
    update: {},
    create: { name: 'Beauty Platform', slug: 'beauty-platform' },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: { name: 'SUPER_ADMIN', isSystem: true },
  });

  await prisma.user.upsert({
    where: { email: 'admin@beauty-platform.local' },
    update: {},
    create: {
      email: 'admin@beauty-platform.local',
      passwordHash: await bcrypt.hash('ChangeMe123!', 10),
      firstName: 'Platform',
      lastName: 'Admin',
      roles: { create: { roleId: adminRole.id } },
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: { code: 'WELCOME10', type: 'PERCENTAGE', value: 10 },
  });
  await prisma.coupon.upsert({
    where: { code: 'FLAT5' },
    update: {},
    create: { code: 'FLAT5', type: 'FIXED_AMOUNT', value: 5, minOrderAmount: 30 },
  });
  await prisma.coupon.upsert({
    where: { code: 'EXPIRED10' },
    update: {},
    create: { code: 'EXPIRED10', type: 'PERCENTAGE', value: 10, endsAt: new Date('2020-01-01') },
  });

  await prisma.warehouse.upsert({
    where: { sellerId_code: { sellerId: seller.id, code: 'MAIN' } },
    update: {},
    create: {
      sellerId: seller.id,
      name: 'Main Warehouse',
      code: 'MAIN',
      line1: '1 Beauty Way',
      city: 'Montreal',
      country: 'CA',
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
