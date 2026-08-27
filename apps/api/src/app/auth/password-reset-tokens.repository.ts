import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'node:crypto';

interface ResetTokenRecord {
  token: string;
  userId: string;
  expiresAt: Date;
  used: boolean;
}

export abstract class PasswordResetTokensRepository {
  abstract create(userId: string): Promise<string>;
  abstract findValid(token: string): Promise<ResetTokenRecord | null>;
  abstract markUsed(token: string): Promise<void>;
}

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes — short-lived, unlike refresh tokens

/**
 * TEMPORARY in-memory implementation. Single-use by design (markUsed
 * makes findValid reject it afterward) — a reset link must not be
 * replayable even within its 30-minute window.
 */
@Injectable()
export class PrismaPasswordResetTokensRepository implements PasswordResetTokensRepository {
  constructor(private readonly prisma: PrismaService) {}
  async create(userId: string) { const token = randomBytes(32).toString('hex'); await this.prisma.passwordresettoken.create({ data: { id: randomUUID(), token, userId, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) } }); return token; }
  async findValid(token: string) { const record = await this.prisma.passwordresettoken.findFirst({ where: { token, usedAt: null, expiresAt: { gt: new Date() } } }); return record ? { token: record.token, userId: record.userId, expiresAt: record.expiresAt, used: false } : null; }
  async markUsed(token: string) { await this.prisma.passwordresettoken.updateMany({ where: { token, usedAt: null }, data: { usedAt: new Date() } }); }
}
