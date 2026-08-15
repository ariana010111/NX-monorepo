import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
// Usage: @Roles('SUPER_ADMIN') — checked against the roles array on the
// authenticated user's JWT payload. Matches your schema's Role table by
// name rather than a hardcoded enum, so new admin roles need no code
// change here, only a new Role row and a different string passed in.
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
