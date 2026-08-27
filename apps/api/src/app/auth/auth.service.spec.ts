import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { PasswordResetTokensRepository } from './password-reset-tokens.repository';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let refreshTokensRepo: jest.Mocked<RefreshTokensRepository>;
  let passwordResetTokensRepo: jest.Mocked<PasswordResetTokensRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { findByEmail: jest.fn(), findById: jest.fn(), create: jest.fn(), updatePassword: jest.fn() },
        },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('signed.jwt.token') } },
        {
          provide: RefreshTokensRepository,
          useValue: { create: jest.fn().mockResolvedValue('refresh-token-abc'), findValid: jest.fn(), revoke: jest.fn(), revokeAllForUser: jest.fn() },
        },
        {
          provide: PasswordResetTokensRepository,
          useValue: { create: jest.fn().mockResolvedValue('reset-token-xyz'), findValid: jest.fn(), markUsed: jest.fn() },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    usersService = module.get(UsersService);
    refreshTokensRepo = module.get(RefreshTokensRepository);
    passwordResetTokensRepo = module.get(PasswordResetTokensRepository);
  });

  describe('register', () => {
    it('creates a CUSTOMER-role user and returns access + refresh tokens', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: 'u1',
        email: 'new@example.com',
        passwordHash: 'hashed',
        firstName: 'Jane',
        lastName: 'Doe',
        roles: ['CUSTOMER'],
        permissions: [],
      });

      const result = await authService.register({
        email: 'new@example.com',
        password: 'SecurePass123',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.refreshToken).toBe('refresh-token-abc');
      expect(result.user.roles).toEqual(['CUSTOMER']);
      expect(result.user).not.toHaveProperty('passwordHash'); // never leak the hash
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com', roles: ['CUSTOMER'] }),
      );
      expect(refreshTokensRepo.create).toHaveBeenCalledWith('u1');
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

    it('succeeds with the correct password and returns access + refresh tokens', async () => {
      const bcrypt = require('bcryptjs');
      usersService.findByEmail.mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        passwordHash: bcrypt.hashSync('correct-password', 10),
        firstName: 'A',
        lastName: 'B',
        roles: ['SUPER_ADMIN'],
        permissions: [],
      });

      const result = await authService.login({ email: 'user@example.com', password: 'correct-password' });
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.refreshToken).toBe('refresh-token-abc');
      expect(result.user.roles).toEqual(['SUPER_ADMIN']);
    });
  });

  describe('refresh', () => {
    it('rejects an invalid or expired refresh token', async () => {
      refreshTokensRepo.findValid.mockResolvedValue(null);
      await expect(authService.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rotates the token: revokes the old one and issues a new one', async () => {
      refreshTokensRepo.findValid.mockResolvedValue({ token: 'old-token', userId: 'u1', expiresAt: new Date(Date.now() + 100000) });
      usersService.findById.mockResolvedValue({ id: 'u1', email: 'user@example.com', passwordHash: 'x', firstName: 'A', lastName: 'B', roles: ['CUSTOMER'], permissions: [] });

      const result = await authService.refresh('old-token');

      expect(refreshTokensRepo.revoke).toHaveBeenCalledWith('old-token');
      expect(result.refreshToken).toBe('refresh-token-abc'); // the newly-issued one
    });

    it('rejects if the refresh token is valid but the user no longer exists', async () => {
      refreshTokensRepo.findValid.mockResolvedValue({ token: 'old-token', userId: 'deleted-user', expiresAt: new Date(Date.now() + 100000) });
      usersService.findById.mockResolvedValue(null);

      await expect(authService.refresh('old-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('revokes the given refresh token', async () => {
      await authService.logout('some-token');
      expect(refreshTokensRepo.revoke).toHaveBeenCalledWith('some-token');
    });
  });

  describe('forgotPassword', () => {
    it('returns the same generic message whether or not the account exists (no enumeration leak)', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const resultForMissing = await authService.forgotPassword({ email: 'nobody@example.com' });

      usersService.findByEmail.mockResolvedValue({ id: 'u1', email: 'real@example.com', passwordHash: 'x', firstName: 'A', lastName: 'B', roles: ['CUSTOMER'] });
      const resultForReal = await authService.forgotPassword({ email: 'real@example.com' });

      expect(resultForMissing.message).toBe(resultForReal.message);
    });

    it('does NOT create a reset token for a nonexistent account', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await authService.forgotPassword({ email: 'nobody@example.com' });
      expect(passwordResetTokensRepo.create).not.toHaveBeenCalled();
    });

    it('creates a reset token for a real account', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'u1', email: 'real@example.com', passwordHash: 'x', firstName: 'A', lastName: 'B', roles: ['CUSTOMER'] });
      const result = await authService.forgotPassword({ email: 'real@example.com' });
      expect(passwordResetTokensRepo.create).toHaveBeenCalledWith('u1');
      expect(result.devOnlyResetToken).toBe('reset-token-xyz');
    });
  });

  describe('resetPassword', () => {
    it('rejects an invalid, expired, or already-used token', async () => {
      passwordResetTokensRepo.findValid.mockResolvedValue(null);
      await expect(authService.resetPassword({ token: 'bad', newPassword: 'NewPass123' })).rejects.toThrow(UnauthorizedException);
    });

    it('updates the password, marks the token used, and revokes ALL refresh tokens for that user', async () => {
      passwordResetTokensRepo.findValid.mockResolvedValue({ token: 'good-token', userId: 'u1', expiresAt: new Date(Date.now() + 100000), used: false });

      await authService.resetPassword({ token: 'good-token', newPassword: 'NewSecurePass123' });

      expect(usersService.updatePassword).toHaveBeenCalledWith('u1', expect.any(String));
      expect(passwordResetTokensRepo.markUsed).toHaveBeenCalledWith('good-token');
      expect(refreshTokensRepo.revokeAllForUser).toHaveBeenCalledWith('u1'); // forces re-login everywhere
    });
  });
});
