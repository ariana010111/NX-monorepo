import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

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
export class InMemoryPasswordResetTokensRepository implements PasswordResetTokensRepository {
  private tokens: ResetTokenRecord[] = [];

  async create(userId: string) {
    const token = randomBytes(32).toString('hex');
    this.tokens.push({ token, userId, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS), used: false });
    return token;
  }

  async findValid(token: string) {
    const record = this.tokens.find((t) => t.token === token);
    if (!record || record.used || record.expiresAt < new Date()) return null;
    return record;
  }

  async markUsed(token: string) {
    const record = this.tokens.find((t) => t.token === token);
    if (record) record.used = true;
  }
}
