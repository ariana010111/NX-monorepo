import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Applied GLOBALLY (see app.module.ts APP_GUARD) — every route requires a
 * valid JWT by default. Individual routes opt out with @Public(), which is
 * the safer default direction: a forgotten guard on a new admin endpoint
 * used to mean "wide open"; now a forgotten @Public() means "locked down,"
 * which fails safe instead of failing open.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
