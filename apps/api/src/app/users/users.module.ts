import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository, InMemoryUsersRepository } from './users.repository';

@Module({
  controllers: [UsersController],
  providers: [UsersService, { provide: UsersRepository, useClass: InMemoryUsersRepository }],
  exports: [UsersService],
})
export class UsersModule {}
