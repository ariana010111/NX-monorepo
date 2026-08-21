import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Used ONLY on routes that must serve both guests and logged-in users
 * (order creation, order lookup). Unlike JwtAuthGuard, this NEVER rejects
 * the request — it attempts to populate req.user if a valid token is
 * present, and silently leaves it undefined otherwise (missing token,
 * expired token, garbage token — all treated the same: proceed as guest).
 *
 * Apply alongside @Public() (which exempts the route from the mandatory
 * global JwtAuthGuard) via a route-level @UseGuards(OptionalJwtAuthGuard).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user; // never throws, regardless of token validity — undefined/false just means "guest"
  }
}
