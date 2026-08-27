import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRecord } from './user.types';
import { randomUUID } from 'node:crypto';

export abstract class UsersRepository {
  abstract findByEmail(email: string): Promise<UserRecord | null>;
  abstract findById(id: string): Promise<UserRecord | null>;
  abstract findAll(): Promise<UserRecord[]>;
  abstract create(data: { email: string; passwordHash: string; firstName: string; lastName: string; roles: string[] }): Promise<UserRecord>;
  abstract updatePassword(userId: string, passwordHash: string): Promise<void>;
}

/**
 * Prisma-backed user persistence. Roles are loaded through UserRole.
 */
@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}
  private map(user: { id: string; email: string; passwordHash: string; firstName: string; lastName: string; userrole: Array<{ role: { name: string; rolepermission: Array<{ permission: { name: string } }> } }> }): UserRecord {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.userrole.map(({ role }) => role.name === 'SUPER_ADMIN' ? 'SUPERADMIN' : role.name),
      permissions: user.userrole.flatMap(({ role }) => role.rolepermission.map(({ permission }) => permission.name)),
    };
  }
  private include = { userrole: { include: { role: { include: { rolepermission: { include: { permission: true } } } } } } } as const;
  async findByEmail(email: string) { const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null }, include: this.include }); return user ? this.map(user) : null; }
  async findById(id: string) { const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null }, include: this.include }); return user ? this.map(user) : null; }
  async findAll() { return (await this.prisma.user.findMany({ where: { deletedAt: null }, include: this.include })).map((user) => this.map(user)); }
  async create(data: { email: string; passwordHash: string; firstName: string; lastName: string; roles: string[] }) {
    const userId = randomUUID();
    await this.prisma.user.create({
      data: { id: userId, email: data.email, passwordHash: data.passwordHash, firstName: data.firstName, lastName: data.lastName, updatedAt: new Date() } as any,
    });
    for (const roleName of data.roles) {
      const role = await this.prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: { id: randomUUID(), name: roleName, updatedAt: new Date() } as any,
      });
      await this.prisma.userrole.create({ data: { userId, roleId: role.id } });
    }
    return this.map(await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, include: this.include }));
  }
  async updatePassword(userId: string, passwordHash: string) { await this.prisma.user.updateMany({ where: { id: userId, deletedAt: null }, data: { passwordHash } }); }
}
