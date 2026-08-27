import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;

    const user = context.switchToHttp().getRequest().user;
    const isSuperadmin = user?.roles?.some((role: string) => role === 'SUPERADMIN' || role === 'SUPER_ADMIN');
    const hasPermissions = required.every((permission) => user?.permissions?.includes(permission));
    if (!isSuperadmin && !hasPermissions) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
