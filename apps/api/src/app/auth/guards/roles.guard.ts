import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    const hasRole = user?.roles?.some((role: string) => {
      const normalizedRole = role === 'SUPER_ADMIN' ? 'SUPERADMIN' : role;
      return requiredRoles.some((requiredRole) => (requiredRole === 'SUPER_ADMIN' ? 'SUPERADMIN' : requiredRole) === normalizedRole);
    });
    if (!hasRole) {
      throw new ForbiddenException(`Requires one of these roles: ${requiredRoles.join(', ')}`);
    }
    return true;
  }
}
