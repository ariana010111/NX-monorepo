import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * NOTE (validation pass): this file will not type-check until you run
 * `npx prisma generate` locally — @prisma/client ships no real types
 * until generate has produced them from prisma/schema.prisma. It is
 * deliberately NOT imported by PrismaModule/AppModule yet in this
 * validation branch so the rest of the build can be verified for real.
 * Wire it back in as the first step after running prisma generate locally.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
