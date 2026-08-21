import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

interface RefreshTokenRecord {
  token: string;
  userId: string;
  expiresAt: Date;
}

export abstract class RefreshTokensRepository {
  abstract create(userId: string): Promise<string>;
  abstract findValid(token: string): Promise<RefreshTokenRecord | null>;
  abstract revoke(token: string): Promise<void>;
  abstract revokeAllForUser(userId: string): Promise<void>;
}

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Opaque random tokens stored server-side, NOT signed JWTs. Deliberate:
 * an opaque token can be revoked by deleting one row; a signed refresh
 * JWT is valid until it expires regardless of what the server "knows,"
 * which means real revocation needs a blacklist anyway — so there's no
 * advantage to signing these, only the cost of managing a denylist.
 *
 * TEMPORARY in-memory implementation — same pattern as every other
 * repository. The real Prisma-backed version would add a RefreshToken
 * table (not currently in the approved schema — a gap to fold into the
 * next schema revision, not into this file).
 */
@Injectable()
export class PrismaRefreshTokensRepository implements RefreshTokensRepository {
  constructor(private readonly prisma: PrismaService) {}
  async create(userId: string) { const token = randomBytes(32).toString('hex'); await this.prisma.refreshToken.create({ data: { token, userId, expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS) } }); return token; }
  async findValid(token: string) { const record = await this.prisma.refreshToken.findFirst({ where: { token, revokedAt: null, expiresAt: { gt: new Date() } } }); return record ? { token: record.token, userId: record.userId, expiresAt: record.expiresAt } : null; }
  async revoke(token: string) { await this.prisma.refreshToken.updateMany({ where: { token, revokedAt: null }, data: { revokedAt: new Date() } }); }
  async revokeAllForUser(userId: string) { await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }); }
}
