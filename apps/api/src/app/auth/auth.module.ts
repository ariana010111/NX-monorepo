import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsersModule } from '../users/users.module';
import { JWT_SECRET, JWT_EXPIRES_IN } from './auth.constants';
import { RefreshTokensRepository, PrismaRefreshTokensRepository } from './refresh-tokens.repository';
import { PasswordResetTokensRepository, PrismaPasswordResetTokensRepository } from './password-reset-tokens.repository';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: JWT_EXPIRES_IN } }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: RefreshTokensRepository, useClass: PrismaRefreshTokensRepository },
    { provide: PasswordResetTokensRepository, useClass: PrismaPasswordResetTokensRepository },
    // Both guards applied globally, in order: authenticate first, then
    // authorize. Individual routes opt out of auth with @Public() and opt
    // into role checks with @Roles(...).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
