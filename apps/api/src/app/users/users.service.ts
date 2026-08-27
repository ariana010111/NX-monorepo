import { Injectable, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from './users.repository';
import { UserResponseDto } from './dto/user-response.dto';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  findByEmail(email: string) {
    return this.usersRepo.findByEmail(email);
  }

  findById(id: string) {
    return this.usersRepo.findById(id);
  }

  async findAll(actorRoles: string[] = []): Promise<UserResponseDto[]> {
    const users = await this.usersRepo.findAll();
    // Strips passwordHash explicitly here rather than trusting callers to
    // remember — this is the one place a full user list leaves the
    // service boundary, so it's the one place that matters most.
    const visible = actorRoles.some((role) => role === 'SUPERADMIN' || role === 'SUPER_ADMIN' || role === 'ADMIN')
      ? users
      : users.filter((user) => user.roles.some((role) => role === 'STAFF' || role === 'CUSTOMER'));
    return visible.map(({ id, email, firstName, lastName, roles, permissions }) => ({ id, email, firstName, lastName, roles, permissions }));
  }

  create(data: { email: string; passwordHash: string; firstName: string; lastName: string; roles: string[] }) {
    return this.usersRepo.create(data);
  }

  async createManaged(dto: CreateManagedUserDto, actorRoles: string[]) {
    const isSuperadmin = actorRoles.some((role) => role === 'SUPERADMIN' || role === 'SUPER_ADMIN');
    if (dto.role === 'ADMIN' && !isSuperadmin) {
      throw new ForbiddenException('Only SUPER_ADMIN can create ADMIN users');
    }
    if (dto.role === 'CUSTOMER' && !actorRoles.some((role) => ['SUPERADMIN', 'SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(role))) {
      throw new ForbiddenException('Only staff can create customer users');
    }
    const existing = await this.usersRepo.findByEmail(dto.email);
    if (existing) throw new ForbiddenException('An account with this email already exists');
    return this.usersRepo.create({
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, 12),
      firstName: dto.firstName,
      lastName: dto.lastName,
      roles: [dto.role],
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.usersRepo.updatePassword(userId, passwordHash);
  }
}
