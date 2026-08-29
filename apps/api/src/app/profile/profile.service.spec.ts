import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileRepository } from './profile.repository';
import { CustomerProfileResponseDto } from './dto/customer-profile-response.dto';
import { AdminCustomerSummaryDto } from './dto/admin-customer-summary.dto';

const customerUser = { userId: 'u1', email: 'a@b.com', roles: ['CUSTOMER'], permissions: [] };
const adminUser = { userId: 'a1', email: 'admin@b.com', roles: ['ADMIN'], permissions: [] };

const sampleProfile: CustomerProfileResponseDto = {
  id: 'u1',
  email: 'a@b.com',
  firstName: 'Alice',
  lastName: 'Smith',
  phone: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  orderCount: 2,
  lifetimeSpend: 49.98,
  lastOrderAt: '2026-08-01T00:00:00.000Z',
  orders: [],
};

describe('ProfileService', () => {
  let service: ProfileService;
  let repo: jest.Mocked<ProfileRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: ProfileRepository,
          useValue: {
            findCustomerProfile: jest.fn(),
            findAllCustomers: jest.fn(),
            findCustomerById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ProfileService);
    repo = module.get(ProfileRepository);
  });

  describe('getMyProfile', () => {
    it('returns the customer profile when found', async () => {
      repo.findCustomerProfile.mockResolvedValue(sampleProfile);
      const result = await service.getMyProfile(customerUser);
      expect(result).toBe(sampleProfile);
      expect(repo.findCustomerProfile).toHaveBeenCalledWith('u1');
    });

    it('throws NotFoundException when the user record does not exist', async () => {
      repo.findCustomerProfile.mockResolvedValue(null);
      await expect(service.getMyProfile(customerUser)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when called by an ADMIN role — admins use /admin/customers instead', async () => {
      await expect(service.getMyProfile(adminUser)).rejects.toThrow(ForbiddenException);
      expect(repo.findCustomerProfile).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException for STAFF role too', async () => {
      const staffUser = { ...adminUser, roles: ['STAFF'] };
      await expect(service.getMyProfile(staffUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listCustomers', () => {
    it('delegates to the repository', async () => {
      const list: AdminCustomerSummaryDto[] = [];
      repo.findAllCustomers.mockResolvedValue(list);
      const result = await service.listCustomers();
      expect(result).toBe(list);
      expect(repo.findAllCustomers).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCustomerById', () => {
    it('returns the customer when found', async () => {
      repo.findCustomerById.mockResolvedValue(sampleProfile);
      const result = await service.getCustomerById('u1');
      expect(result).toBe(sampleProfile);
    });

    it('throws NotFoundException for an unknown customer id', async () => {
      repo.findCustomerById.mockResolvedValue(null);
      await expect(service.getCustomerById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
