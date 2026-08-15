import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository, InMemoryUsersRepository } from './users.repository';

@Module({
  providers: [UsersService, { provide: UsersRepository, useClass: InMemoryUsersRepository }],
  exports: [UsersService],
})
export class UsersModule {}
