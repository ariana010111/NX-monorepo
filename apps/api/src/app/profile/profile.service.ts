import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProfileRepository } from './profile.repository';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private readonly profileRepo: ProfileRepository) {}

  /**
   * Resolves the authenticated customer's own profile with order history and
   * lifetime statistics. Admin roles may not call this — they use
   * `getCustomerById` instead so the access paths remain explicit.
   */
  async getMyProfile(user: AuthenticatedUser) {
    const isAdminActor = user.roles.some((r) => ['SUPERADMIN', 'SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(r));
    if (isAdminActor) {
      throw new ForbiddenException('Admin accounts do not have a customer profile. Use /admin/customers.');
    }
    this.logger.log(`getMyProfile userId=${user.userId}`);
    const profile = await this.profileRepo.findCustomerProfile(user.userId);
    if (!profile) throw new NotFoundException(`Profile not found for user "${user.userId}"`);
    return profile;
  }

  /** Admin — list all customer summaries. */
  listCustomers() {
    this.logger.log('listCustomers');
    return this.profileRepo.findAllCustomers();
  }

  /** Admin — full customer detail including order history. */
  async getCustomerById(targetUserId: string) {
    this.logger.log(`getCustomerById targetUserId=${targetUserId}`);
    const profile = await this.profileRepo.findCustomerById(targetUserId);
    if (!profile) throw new NotFoundException(`Customer "${targetUserId}" not found`);
    return profile;
  }
}
