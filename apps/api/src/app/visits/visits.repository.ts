import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VisitResponseDto } from './dto/visit-response.dto';
import crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// Input type for recording a visit
// ---------------------------------------------------------------------------
export interface CreateVisitInput {
  path: string;
  userId?: string;
  productId?: string;
  sessionId?: string;
  referrer?: string;
  userAgent?: string;
  /** Raw visitor IP — hashed to SHA-256 before storage (no PII persisted). */
  ip?: string;
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------
export abstract class VisitsRepository {
  abstract record(input: CreateVisitInput): Promise<VisitResponseDto>;
}

// ---------------------------------------------------------------------------
// Prisma implementation
//
// The `storevisit` model is confirmed present in prisma/schema.prisma
// (added by the Database agent).  The repository uses a `(this.prisma as any)`
// cast until `npx prisma generate` has been run to emit the typed accessor.
//
// Integration checklist before the cast can be removed:
//   1. ✅ storevisit model added to prisma/schema.prisma
//   2. ⬜ `npx prisma migrate dev --name add_storevisit` run against the DB
//   3. ⬜ `npx prisma generate` run to regenerate @prisma/client typings
//   4. ⬜ Replace `(this.prisma as any).storevisit` with `this.prisma.storevisit`
//
// Schema fields used here (from prisma/schema.prisma):
//   id, userId, productId, sessionId, path, referrer, userAgent, ipHash, createdAt
// ---------------------------------------------------------------------------
@Injectable()
export class PrismaVisitsRepository implements VisitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private hashIp(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex');
  }

  async record(input: CreateVisitInput): Promise<VisitResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visit = await (this.prisma as any).storevisit.create({
      data: {
        id: crypto.randomUUID(),
        userId: input.userId ?? null,
        productId: input.productId ?? null,
        sessionId: input.sessionId ?? null,
        path: input.path,
        referrer: input.referrer ?? null,
        userAgent: input.userAgent ?? null,
        ipHash: input.ip ? this.hashIp(input.ip) : null,
      },
    });
    return {
      id: visit.id,
      userId: visit.userId,
      sessionId: visit.sessionId,
      productId: visit.productId,
      path: visit.path,
      referrer: visit.referrer,
      createdAt: visit.createdAt instanceof Date ? visit.createdAt.toISOString() : String(visit.createdAt),
    };
  }
}
