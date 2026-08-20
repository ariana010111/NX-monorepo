import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('SUPER_ADMIN')
@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  findAll() {
    return this.usersService.findAll();
  }
}
