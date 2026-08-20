import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  findByEmail(email: string) {
    return this.usersRepo.findByEmail(email);
  }

  findById(id: string) {
    return this.usersRepo.findById(id);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepo.findAll();
    // Strips passwordHash explicitly here rather than trusting callers to
    // remember — this is the one place a full user list leaves the
    // service boundary, so it's the one place that matters most.
    return users.map(({ id, email, firstName, lastName, roles }) => ({ id, email, firstName, lastName, roles }));
  }

  create(data: { email: string; passwordHash: string; firstName: string; lastName: string; roles: string[] }) {
    return this.usersRepo.create(data);
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.usersRepo.updatePassword(userId, passwordHash);
  }
}
