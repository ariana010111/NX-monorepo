import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRecord } from './user.types';

export abstract class UsersRepository {
  abstract findByEmail(email: string): Promise<UserRecord | null>;
  abstract findById(id: string): Promise<UserRecord | null>;
  abstract findAll(): Promise<UserRecord[]>;
  abstract create(data: { email: string; passwordHash: string; firstName: string; lastName: string; roles: string[] }): Promise<UserRecord>;
  abstract updatePassword(userId: string, passwordHash: string): Promise<void>;
}

/**
 * Prisma-backed user persistence. Roles are loaded through UserRole.
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
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}
  private map(user: any): UserRecord { return { id: user.id, email: user.email, passwordHash: user.passwordHash, firstName: user.firstName, lastName: user.lastName, roles: user.roles.map((userRole: any) => userRole.role.name) }; }
  private include = { roles: { include: { role: true } } };
  async findByEmail(email: string) { const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null }, include: this.include }); return user ? this.map(user) : null; }
  async findById(id: string) { const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null }, include: this.include }); return user ? this.map(user) : null; }
  async findAll() { return (await this.prisma.user.findMany({ where: { deletedAt: null }, include: this.include })).map((user) => this.map(user)); }
  async create(data: { email: string; passwordHash: string; firstName: string; lastName: string; roles: string[] }) { const user = await this.prisma.user.create({ data: { email: data.email, passwordHash: data.passwordHash, firstName: data.firstName, lastName: data.lastName, roles: { create: await Promise.all(data.roles.map(async (roleName) => ({ role: { connectOrCreate: { where: { name: roleName }, create: { name: roleName } } } }))) } }, include: this.include }); return this.map(user); }
  async updatePassword(userId: string, passwordHash: string) { await this.prisma.user.updateMany({ where: { id: userId, deletedAt: null }, data: { passwordHash } }); }
}
