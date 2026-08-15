import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRecord } from './user.types';

export abstract class UsersRepository {
  abstract findByEmail(email: string): Promise<UserRecord | null>;
  abstract findById(id: string): Promise<UserRecord | null>;
  abstract create(data: { email: string; passwordHash: string; firstName: string; lastName: string; roles: string[] }): Promise<UserRecord>;
}

/**
 * TEMPORARY in-memory implementation — same pattern as every other
 * repository in this codebase. The real Prisma-backed version writes
 * User + UserRole rows (UserRole joining to the Role/Permission tables
 * from the approved schema) rather than a flat roles[] array, but the
 * shape returned to AuthService is unchanged.
 *
 * Seeded with one admin account so the admin app is reachable immediately:
 *   admin@beauty-platform.local / ChangeMe123!
 * Change this password (or better, remove the seed) before any real deploy.
 */
@Injectable()
export class InMemoryUsersRepository implements UsersRepository {
  private users: UserRecord[] = [
    {
      id: 'u-admin-seed',
      email: 'admin@beauty-platform.local',
      // bcrypt.hashSync used here specifically to avoid an async
      // constructor race — findByEmail() could otherwise run before an
      // async seed finished, intermittently failing the very first login.
      passwordHash: bcrypt.hashSync('ChangeMe123!', 10),
      firstName: 'Platform',
      lastName: 'Admin',
      roles: ['SUPER_ADMIN'],
    },
  ];

  async findByEmail(email: string) {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async create(data: { email: string; passwordHash: string; firstName: string; lastName: string; roles: string[] }) {
    const user: UserRecord = { id: `u${Date.now()}`, ...data };
    this.users.push(user);
    return user;
  }
}
