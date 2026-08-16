import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { findByEmail: jest.fn(), findById: jest.fn(), create: jest.fn() },
        },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('signed.jwt.token') } },
      ],
    }).compile();

    authService = module.get(AuthService);
    usersService = module.get(UsersService);
  });

  describe('register', () => {
    it('creates a CUSTOMER-role user and returns a token', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: 'u1',
        email: 'new@example.com',
        passwordHash: 'hashed',
        firstName: 'Jane',
        lastName: 'Doe',
        roles: ['CUSTOMER'],
      });

      const result = await authService.register({
        email: 'new@example.com',
        password: 'SecurePass123',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user.roles).toEqual(['CUSTOMER']);
      expect(result.user).not.toHaveProperty('passwordHash'); // never leak the hash
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com', roles: ['CUSTOMER'] }),
      );
    });

    it('rejects a duplicate email with 409', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'u1',
        email: 'exists@example.com',
        passwordHash: 'hashed',
        firstName: 'A',
        lastName: 'B',
        roles: ['CUSTOMER'],
      });

      await expect(
        authService.register({ email: 'exists@example.com', password: 'x', firstName: 'A', lastName: 'B' }),
      ).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('rejects a nonexistent email with 401 (not a distinguishable error)', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(authService.login({ email: 'nobody@example.com', password: 'x' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects a wrong password with the SAME error as a nonexistent email', async () => {
      // bcrypt hash of 'correct-password' — real hash, not a stub, so
      // bcrypt.compare is exercised for real rather than mocked away.
      const bcrypt = require('bcryptjs');
      usersService.findByEmail.mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        passwordHash: bcrypt.hashSync('correct-password', 10),
        firstName: 'A',
        lastName: 'B',
        roles: ['CUSTOMER'],
      });

      await expect(authService.login({ email: 'user@example.com', password: 'wrong-password' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('succeeds with the correct password and returns a token', async () => {
      const bcrypt = require('bcryptjs');
      usersService.findByEmail.mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        passwordHash: bcrypt.hashSync('correct-password', 10),
        firstName: 'A',
        lastName: 'B',
        roles: ['SUPER_ADMIN'],
      });

      const result = await authService.login({ email: 'user@example.com', password: 'correct-password' });
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user.roles).toEqual(['SUPER_ADMIN']);
    });
  });
});
