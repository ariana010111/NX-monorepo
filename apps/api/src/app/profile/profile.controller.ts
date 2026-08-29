import { Controller, Get, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { CustomerProfileResponseDto } from './dto/customer-profile-response.dto';
import { AdminCustomerSummaryDto } from './dto/admin-customer-summary.dto';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiBearerAuth()
@ApiTags('profile')
@Controller()
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);
  constructor(private readonly profileService: ProfileService) {}

  // ------------------------------------------------------------------
  // Customer self-serve profile — requires any authenticated user; the
  // service further enforces that admin roles are rejected so they
  // cannot accidentally read a customer-scope view of their own account.
  // ------------------------------------------------------------------
  @Get('profile/me')
  @ApiOperation({ summary: 'Get the authenticated customer profile with order history and lifetime stats' })
  @ApiOkResponse({ type: CustomerProfileResponseDto })
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`GET /profile/me userId=${user.userId}`);
    return this.profileService.getMyProfile(user);
  }

  // ------------------------------------------------------------------
  // Admin customer management
  // ------------------------------------------------------------------
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @Get('admin/customers')
  @ApiOperation({ summary: 'Admin: list all customers with lifetime stats' })
  @ApiOkResponse({ type: AdminCustomerSummaryDto, isArray: true })
  listCustomers() {
    this.logger.log('GET /admin/customers');
    return this.profileService.listCustomers();
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @Get('admin/customers/:id')
  @ApiOperation({ summary: 'Admin: get customer detail with full order history' })
  @ApiOkResponse({ type: CustomerProfileResponseDto })
  getCustomerById(@Param('id') id: string) {
    this.logger.log(`GET /admin/customers/${id}`);
    return this.profileService.getCustomerById(id);
  }
}
