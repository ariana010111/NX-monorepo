import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { Permission, Permissions } from '../auth/permissions';

@Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions(Permission.UsersRead)
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findAll(user.roles);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateManagedUserDto) {
    return this.usersService.createManaged(dto, user.roles);
  }
}
