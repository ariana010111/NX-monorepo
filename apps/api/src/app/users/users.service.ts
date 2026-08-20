import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  findByEmail(email: string) {
    return this.usersRepo.findByEmail(email);
  }

  findById(id: string) {
    return this.usersRepo.findById(id);
  }

  create(data: { email: string; passwordHash: string; firstName: string; lastName: string; roles: string[] }) {
    return this.usersRepo.create(data);
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.usersRepo.updatePassword(userId, passwordHash);
  }
}
