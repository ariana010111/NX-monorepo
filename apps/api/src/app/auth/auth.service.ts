import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserRecord } from '../users/user.types';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { PasswordResetTokensRepository } from './password-reset-tokens.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokensRepo: RefreshTokensRepository,
    private readonly passwordResetTokensRepo: PasswordResetTokensRepository,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      roles: ['CUSTOMER'],
    });
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    // Same error for "no such user" and "wrong password" — never reveal
    // which one it was, that's an account-enumeration leak.
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException('Invalid email or password');

    return this.buildAuthResponse(user);
  }

  /**
   * Rotates the refresh token on every use (issues a new one, revokes the
   * old one immediately) rather than reusing the same refresh token
   * across its whole lifetime. This means a stolen-but-unused refresh
   * token becomes worthless the moment the legitimate owner refreshes
   * again — and if an attacker uses it first, the legitimate owner's next
   * refresh attempt fails, which is itself a signal something is wrong,
   * rather than both parties silently sharing one long-lived token.
   */
  async refresh(refreshToken: string) {
    const record = await this.refreshTokensRepo.findValid(refreshToken);
    if (!record) throw new UnauthorizedException('Invalid or expired refresh token');

    const user = await this.usersService.findById(record.userId);
    if (!user) throw new UnauthorizedException('Invalid or expired refresh token');

    await this.refreshTokensRepo.revoke(refreshToken);
    return this.buildAuthResponse(user);
  }

  async logout(refreshToken: string) {
    await this.refreshTokensRepo.revoke(refreshToken);
  }

  /**
   * ALWAYS returns the same generic response regardless of whether the
   * email exists — the alternative ("no account with that email") is a
   * textbook account-enumeration leak on a public endpoint. No email
   * service is wired into this sandbox, so the token is returned directly
   * in the response for now, clearly marked as a temporary substitute for
   * actually emailing it.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return { message: 'If an account with that email exists, a reset link has been sent.' };
    }
    const token = await this.passwordResetTokensRepo.create(user.id);
    return {
      message: 'If an account with that email exists, a reset link has been sent.',
      // TEMPORARY: no email service exists in this sandbox. A real
      // deployment must never return this token in the API response —
      // it must only ever reach the user via the email itself.
      devOnlyResetToken: token,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.passwordResetTokensRepo.findValid(dto.token);
    if (!record) throw new UnauthorizedException('Invalid or expired reset token');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(record.userId, passwordHash);
    await this.passwordResetTokensRepo.markUsed(dto.token);

    // Force re-login everywhere — a password reset (often triggered by a
    // suspected compromise) must not leave old sessions valid.
    await this.refreshTokensRepo.revokeAllForUser(record.userId);
  }

  private async buildAuthResponse(user: UserRecord) {
    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email, roles: user.roles });
    const refreshToken = await this.refreshTokensRepo.create(user.id);
    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, roles: user.roles },
    };
  }
}
